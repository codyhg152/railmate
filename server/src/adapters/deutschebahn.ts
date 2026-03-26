import { BaseTrainAdapter } from './base';
import { Station, Departure, Journey, TrainJourney, JourneyStatus, Stopover } from '../types';

interface DBLocation {
  id: string;
  name: string;
  type: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  products?: Station['products'];
}

interface DBDeparture {
  tripId: string;
  stop: {
    id: string;
    name: string;
  };
  when: string;
  plannedWhen: string;
  delay: number | null;
  platform: string | null;
  plannedPlatform: string | null;
  direction: string;
  line: {
    id: string;
    name: string;
    product: string;
    productName: string;
    mode: string;
    public: boolean;
  };
  remarks: Array<{ type: string; code: string; text: string }>;
  cancelled?: boolean;
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
    super('DeutscheBahn', 'https://v5.db.transport.rest', 100);
  }

  async searchStations(query: string, limit: number = 10): Promise<Station[]> {
    const cacheKey = `db:stations:${query}:${limit}`;
    const cached = await this.getCached<Station[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<DBLocation[]>('/locations', {
        params: { query, results: limit, fuzzy: true },
      });

      const stations = response.data
        .filter(loc => loc.type === 'station')
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
      console.error('Error searching stations:', error);
      return [];
    }
  }

  async getDepartures(stationId: string, duration: number = 60): Promise<Departure[]> {
    const cacheKey = `db:departures:${stationId}:${duration}`;
    const cached = await this.getCached<Departure[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ departures: DBDeparture[] }>(
        `/stops/${stationId}/departures`,
        {
          params: { duration, results: 20 },
        }
      );

      const departures = response.data.departures.map(dep => ({
        tripId: dep.tripId,
        stop: {
          id: dep.stop.id,
          name: dep.stop.name,
          country: 'DE',
          coordinates: { latitude: 0, longitude: 0 },
          timezone: 'Europe/Berlin',
        },
        when: dep.when,
        plannedWhen: dep.plannedWhen,
        delay: dep.delay || 0,
        platform: dep.platform || dep.plannedPlatform || '',
        plannedPlatform: dep.plannedPlatform || '',
        direction: dep.direction,
        line: dep.line,
        remarks: dep.remarks || [],
        cancelled: dep.cancelled || false,
      }));

      await this.setCached(cacheKey, departures, 30); // 30 seconds
      return departures;
    } catch (error) {
      console.error('Error getting departures:', error);
      return [];
    }
  }

  async searchJourneys(from: string, to: string, date?: string): Promise<Journey[]> {
    const departureTime = date || new Date().toISOString();
    const cacheKey = `db:journeys:${from}:${to}:${departureTime}`;
    const cached = await this.getCached<Journey[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ journeys: DBJourney[] }>('/journeys', {
        params: {
          from,
          to,
          departure: departureTime,
          results: 5,
        },
      });

      const journeys = response.data.journeys.map((journey, index) => ({
        id: `db-${from}-${to}-${departureTime}-${index}`,
        type: journey.type,
        legs: journey.legs,
        price: journey.price,
      }));

      await this.setCached(cacheKey, journeys, 300); // 5 minutes
      return journeys;
    } catch (error) {
      console.error('Error searching journeys:', error);
      return [];
    }
  }

  async getJourneyDetails(journeyId: string): Promise<TrainJourney | null> {
    const cacheKey = `db:journey:${journeyId}`;
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
          id: firstStop.stop.id,
          name: firstStop.stop.name,
          country: 'DE',
          coordinates: { latitude: 0, longitude: 0 },
          timezone: 'Europe/Berlin',
        },
        destination: {
          id: lastStop.stop.id,
          name: lastStop.stop.name,
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
      console.error('Error getting journey details:', error);
      return null;
    }
  }
}