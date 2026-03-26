import { BaseTrainAdapter } from './base';
import { Station, Departure, Journey, TrainJourney, JourneyStatus, Stopover } from '../types';

/**
 * Austrian Federal Railways (OeBB) Adapter
 * Uses v6.oebb.transport.rest (HAFAS-based REST API, same format as DB)
 *
 * API Documentation: https://v6.oebb.transport.rest/docs
 * Backend: oebb.macistry.com/api (community-maintained HAFAS wrapper)
 * Rate Limit: ~100 requests/minute
 *
 * Endpoints:
 * - /locations - Station search
 * - /stops/{id}/departures - Departures
 * - /journeys - Journey planning
 * - /trips/{id} - Trip/journey details
 *
 * Caching Strategy:
 * - Stations: 24 hours
 * - Departures: 30 seconds
 * - Journeys: 5 minutes
 * - Journey Details: 10 seconds
 */

interface OEBBLocation {
  type: string;
  id: string;
  name: string;
  location?: {
    type: string;
    id: string;
    latitude: number;
    longitude: number;
  };
  products?: Station['products'];
  isMeta?: boolean;
}

interface OEBBDeparture {
  tripId: string;
  stop: {
    type: string;
    id: string;
    name: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    products?: Station['products'];
  };
  when: string | null;
  plannedWhen: string;
  delay: number | null;
  platform: string | null;
  plannedPlatform: string | null;
  direction: string;
  provenance?: string | null;
  line: {
    type?: string;
    id?: string;
    fahrtNr?: string;
    name: string;
    public?: boolean;
    adminCode?: string;
    productName?: string;
    mode?: string;
    product: string;
    operator?: { type: string; id: string; name: string };
  };
  remarks?: Array<{ type: string; code: string; text: string }>;
  cancelled?: boolean;
}

interface OEBBJourneyLeg {
  origin: {
    id: string;
    name: string;
    departure: string;
    departurePlatform: string;
    plannedDeparture?: string;
    departureDelay?: number;
  };
  destination: {
    id: string;
    name: string;
    arrival: string;
    arrivalPlatform: string;
    plannedArrival?: string;
    arrivalDelay?: number;
  };
  line: {
    name: string;
    product: string;
  };
  departureDelay?: number;
  arrivalDelay?: number;
  remarks?: Array<{ type: string; code: string; text: string }>;
  stopovers?: Stopover[];
}

interface OEBBJourney {
  type: string;
  legs: OEBBJourneyLeg[];
  price?: {
    amount: number;
    currency: string;
  };
}

interface OEBBTripResponse {
  trip: {
    id: string;
    line: {
      name: string;
      product: string;
    };
    direction: string;
    stopovers: Array<{
      stop?: { id: string; name: string; location?: { latitude: number; longitude: number } };
      arrival: string | null;
      plannedArrival: string | null;
      departure: string | null;
      plannedDeparture: string | null;
      arrivalDelay?: number;
      departureDelay?: number;
      platform?: string;
    }>;
  };
}

export class OEBBAdapter extends BaseTrainAdapter {
  constructor() {
    // Uses oebb.macistry.com/api (same HAFAS format as DB v6)
    super('OeBB', 'https://oebb.macistry.com/api', 100);
    this.apiVersion = '6.0';
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/locations', {
        params: { query: 'Wien', results: 1 },
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('[OeBB] Health check failed:', error);
      return false;
    }
  }

  async searchStations(query: string, limit: number = 10): Promise<Station[]> {
    const cacheKey = `oebb:stations:${query}:${limit}`;
    const cached = await this.getCached<Station[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<OEBBLocation[]>('/locations', {
        params: {
          query,
          results: limit,
          fuzzy: true,
          stops: true,
          addresses: false,
          poi: false,
        },
      });

      const stations = response.data
        .filter(loc => loc.type === 'stop' || loc.type === 'station')
        .map(loc => ({
          id: loc.id,
          name: loc.name,
          country: 'AT',
          coordinates: {
            latitude: loc.location?.latitude || 0,
            longitude: loc.location?.longitude || 0,
          },
          timezone: 'Europe/Vienna',
          products: loc.products,
        }));

      await this.setCached(cacheKey, stations, 86400);
      return stations;
    } catch (error) {
      console.error('[OeBB] Error searching stations:', error);
      return [];
    }
  }

  async getDepartures(stationId: string, duration: number = 60): Promise<Departure[]> {
    const cacheKey = `oebb:departures:${stationId}:${duration}`;
    const cached = await this.getCached<Departure[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ departures: OEBBDeparture[] }>(
        `/stops/${stationId}/departures`,
        {
          params: {
            duration,
            results: 20,
            remarks: true,
          },
        }
      );

      const departures = response.data.departures.map(dep => ({
        tripId: dep.tripId,
        stop: {
          id: dep.stop.id,
          name: dep.stop.name,
          country: 'AT',
          coordinates: {
            latitude: dep.stop.location?.latitude || 0,
            longitude: dep.stop.location?.longitude || 0,
          },
          timezone: 'Europe/Vienna',
        },
        when: dep.when || dep.plannedWhen,
        plannedWhen: dep.plannedWhen,
        delay: dep.delay || 0,
        platform: dep.platform || dep.plannedPlatform || '',
        plannedPlatform: dep.plannedPlatform || '',
        direction: dep.direction,
        line: {
          id: dep.line.id || dep.line.name,
          name: dep.line.name,
          product: dep.line.product,
          productName: dep.line.productName || dep.line.name,
          mode: dep.line.mode || 'train',
          public: dep.line.public ?? true,
        },
        remarks: dep.remarks || [],
        cancelled: dep.cancelled || false,
      }));

      await this.setCached(cacheKey, departures, 30);
      return departures;
    } catch (error) {
      console.error('[OeBB] Error getting departures:', error);
      return [];
    }
  }

  async searchJourneys(from: string, to: string, date?: string): Promise<Journey[]> {
    const departureTime = date || new Date().toISOString();
    const cacheKey = `oebb:journeys:${from}:${to}:${departureTime}`;
    const cached = await this.getCached<Journey[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ journeys: OEBBJourney[] }>('/journeys', {
        params: {
          from,
          to,
          departure: departureTime,
          results: 5,
        },
      });

      const journeys = response.data.journeys.map((journey, index) => ({
        id: `oebb-${from}-${to}-${departureTime}-${index}`,
        type: journey.type,
        legs: journey.legs.map(leg => ({ ...leg, remarks: leg.remarks || [] })),
        price: journey.price,
      }));

      await this.setCached(cacheKey, journeys, 300);
      return journeys;
    } catch (error) {
      console.error('[OeBB] Error searching journeys:', error);
      return [];
    }
  }

  async getJourneyDetails(journeyId: string): Promise<TrainJourney | null> {
    const cacheKey = `oebb:journey:${journeyId}`;
    const cached = await this.getCached<TrainJourney>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<OEBBTripResponse>(
        `/trips/${encodeURIComponent(journeyId)}`
      );
      const trip = response.data.trip;

      if (!trip.stopovers || trip.stopovers.length === 0) {
        return null;
      }

      const firstStop = trip.stopovers[0];
      const lastStop = trip.stopovers[trip.stopovers.length - 1];

      const departureDelay = firstStop.departureDelay || 0;
      const arrivalDelay = lastStop.arrivalDelay || 0;

      let status = JourneyStatus.SCHEDULED;
      if (departureDelay > 0 || arrivalDelay > 0) {
        status = JourneyStatus.DELAYED;
      }

      const trainJourney: TrainJourney = {
        id: trip.id,
        operator: 'OeBB',
        trainNumber: trip.line.name,
        trainType: trip.line.product,
        origin: {
          id: firstStop.stop?.id || '',
          name: firstStop.stop?.name || '',
          country: 'AT',
          coordinates: {
            latitude: firstStop.stop?.location?.latitude || 0,
            longitude: firstStop.stop?.location?.longitude || 0,
          },
          timezone: 'Europe/Vienna',
        },
        destination: {
          id: lastStop.stop?.id || '',
          name: lastStop.stop?.name || '',
          country: 'AT',
          coordinates: {
            latitude: lastStop.stop?.location?.latitude || 0,
            longitude: lastStop.stop?.location?.longitude || 0,
          },
          timezone: 'Europe/Vienna',
        },
        scheduledDeparture: firstStop.plannedDeparture || firstStop.departure || '',
        actualDeparture: firstStop.departure || '',
        departureDelay,
        departurePlatform: firstStop.platform || '',
        scheduledArrival: lastStop.plannedArrival || lastStop.arrival || '',
        actualArrival: lastStop.arrival || '',
        arrivalDelay,
        arrivalPlatform: lastStop.platform || '',
        status,
        stops: trip.stopovers.map(s => ({
          stop: {
            id: s.stop?.id || '',
            name: s.stop?.name || '',
            country: 'AT',
            coordinates: {
              latitude: s.stop?.location?.latitude || 0,
              longitude: s.stop?.location?.longitude || 0,
            },
            timezone: 'Europe/Vienna',
          },
          arrival: s.arrival,
          plannedArrival: s.plannedArrival,
          departure: s.departure,
          plannedDeparture: s.plannedDeparture,
          arrivalDelay: s.arrivalDelay,
          departureDelay: s.departureDelay,
          platform: s.platform,
        })),
        amenities: [],
        cancelled: false,
      };

      await this.setCached(cacheKey, trainJourney, 10);
      return trainJourney;
    } catch (error) {
      console.error('[OeBB] Error getting journey details:', error);
      return null;
    }
  }
}
