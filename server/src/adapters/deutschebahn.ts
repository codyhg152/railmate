import { BaseTrainAdapter } from './base';
import { Station, Departure, Journey, TrainJourney, JourneyStatus, Stopover } from '../types';

/**
 * Deutsche Bahn Adapter
 * Uses v6.db.transport.rest API (v5 is deprecated)
 * 
 * API Documentation: https://v6.db.transport.rest/
 * Rate Limit: 100 requests/minute (strict - lower than v5)
 * 
 * Changes from v5 to v6:
 * - Uses db-vendo-client backend instead of HAFAS
 * - Lower rate limits (be careful with automated requests)
 * - Some endpoints removed: /stops/reachable-from, /radar
 * - Profile parameter available: dbnav (default), db, dbweb
 * 
 * Caching Strategy:
 * - Stations: 24 hours
 * - Departures: 30 seconds
 * - Journeys: 5 minutes
 * - Journey Details: 10 seconds
 */

interface DBLocation {
  id: string;
  name: string;
  type: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  products?: Station['products'];
  weight?: number;
  ril100Ids?: string[];
  ifoptId?: string;
  priceCategory?: number;
  transitAuthority?: string;
  stadaId?: string;
}

interface DBDeparture {
  tripId: string;
  stop: {
    id: string;
    name: string;
    type?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    products?: Station['products'];
    weight?: number;
    ril100Ids?: string[];
    ifoptId?: string;
    priceCategory?: number;
    transitAuthority?: string;
    station?: DBLocation;
    stadaId?: string;
  };
  when: string;
  plannedWhen: string;
  delay: number | null;
  platform: string | null;
  plannedPlatform: string | null;
  direction: string;
  provenance?: string | null;
  line: {
    id?: string;
    name: string;
    product: string;
    productName?: string;
    mode?: string;
    public?: boolean;
    fahrtNr?: string;
    operator?: any;
  };
  remarks: Array<{ type: string; code: string; text: string }>;
  cancelled?: boolean;
  origin?: any;
  destination?: any;
}

interface DBJourneyLeg {
  origin: {
    id: string;
    name: string;
    departure: string;
    departurePlatform: string;
  };
  destination: {
    id: string;
    name: string;
    arrival: string;
    arrivalPlatform: string;
  };
  line: {
    name: string;
    product: string;
  };
  departureDelay?: number;
  arrivalDelay?: number;
  distance?: number;
  remarks: Array<{ type: string; code: string; text: string }>;
  stopovers?: Stopover[];
}

interface DBJourney {
  type: string;
  legs: DBJourneyLeg[];
  price?: {
    amount: number;
    currency: string;
  };
}

interface DBTripsResponse {
  id: string;
  line: {
    name: string;
    product: string;
  };
  direction: string;
  stopovers: Stopover[];
}

export class DeutscheBahnAdapter extends BaseTrainAdapter {
  constructor() {
    // v6 endpoint - v5 is deprecated
    super('DeutscheBahn', 'https://v6.db.transport.rest', 100);
    this.apiVersion = '6.0';
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/locations', {
        params: { query: 'Berlin', results: 1 },
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('[DeutscheBahn] Health check failed:', error);
      return false;
    }
  }

  async searchStations(query: string, limit: number = 10): Promise<Station[]> {
    const cacheKey = `db:v6:stations:${query}:${limit}`;
    const cached = await this.getCached<Station[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<DBLocation[]>('/locations', {
        params: { 
          query, 
          results: limit, 
          fuzzy: true,
          // Optional: use different profile for different data sources
          // profile: 'dbnav' // default, or 'db', 'dbweb'
        },
      });

      const stations = response.data
        .filter(loc => loc.type === 'station' || loc.type === 'stop')
        .map(loc => ({
          id: loc.id,
          name: loc.name,
          country: 'DE',
          coordinates: {
            latitude: loc.location?.latitude || 0,
            longitude: loc.location?.longitude || 0,
          },
          timezone: 'Europe/Berlin',
          products: loc.products,
        }));

      await this.setCached(cacheKey, stations, 86400); // 24 hours
      return stations;
    } catch (error) {
      console.error('[DeutscheBahn] Error searching stations:', error);
      return [];
    }
  }

  async getDepartures(stationId: string, duration: number = 60): Promise<Departure[]> {
    const cacheKey = `db:v6:departures:${stationId}:${duration}`;
    const cached = await this.getCached<Departure[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ departures: DBDeparture[] }>(
        `/stops/${stationId}/departures`,
        {
          params: { 
            duration, 
            results: 20,
            // Include additional fields if needed
            // remarks: true,
          },
        }
      );

      const departures = response.data.departures.map(dep => {
        // Handle both station and stop types
        const stopData = dep.stop.station || dep.stop;
        
        return {
          tripId: dep.tripId,
          stop: {
            id: dep.stop.id,
            name: dep.stop.name,
            country: 'DE',
            coordinates: { 
              latitude: dep.stop.location?.latitude || 0, 
              longitude: dep.stop.location?.longitude || 0 
            },
            timezone: 'Europe/Berlin',
          },
          when: dep.when,
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
        };
      });

      await this.setCached(cacheKey, departures, 30); // 30 seconds
      return departures;
    } catch (error) {
      console.error('[DeutscheBahn] Error getting departures:', error);
      return [];
    }
  }

  async searchJourneys(from: string, to: string, date?: string): Promise<Journey[]> {
    const departureTime = date || new Date().toISOString();
    const cacheKey = `db:v6:journeys:${from}:${to}:${departureTime}`;
    const cached = await this.getCached<Journey[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ journeys: DBJourney[] }>('/journeys', {
        params: {
          from,
          to,
          departure: departureTime,
          results: 5,
          // Optional parameters:
          // transfers: 2, // max transfers
          // transferTime: 10, // minimum transfer time in minutes
        },
      });

      const journeys = response.data.journeys.map((journey, index) => ({
        id: `db-v6-${from}-${to}-${departureTime}-${index}`,
        type: journey.type,
        legs: journey.legs,
        price: journey.price,
      }));

      await this.setCached(cacheKey, journeys, 300); // 5 minutes
      return journeys;
    } catch (error) {
      console.error('[DeutscheBahn] Error searching journeys:', error);
      return [];
    }
  }

  async getJourneyDetails(journeyId: string): Promise<TrainJourney | null> {
    const cacheKey = `db:v6:journey:${journeyId}`;
    const cached = await this.getCached<TrainJourney>(cacheKey);
    if (cached) return cached;

    try {
      // Extract tripId from journeyId or fetch from DB API
      const response = await this.client.get<DBTripsResponse>(`/trips/${journeyId}`);
      const trip = response.data;

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
        operator: 'Deutsche Bahn',
        trainNumber: trip.line.name,
        trainType: trip.line.product,
        origin: {
          id: firstStop.stop?.id || '',
          name: firstStop.stop?.name || '',
          country: 'DE',
          coordinates: { latitude: 0, longitude: 0 },
          timezone: 'Europe/Berlin',
        },
        destination: {
          id: lastStop.stop?.id || '',
          name: lastStop.stop?.name || '',
          country: 'DE',
          coordinates: { latitude: 0, longitude: 0 },
          timezone: 'Europe/Berlin',
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
        stops: trip.stopovers,
        amenities: [],
        cancelled: false,
      };

      await this.setCached(cacheKey, trainJourney, 10); // 10 seconds
      return trainJourney;
    } catch (error) {
      console.error('[DeutscheBahn] Error getting journey details:', error);
      return null;
    }
  }
}
