/**
 * API client for Deutsche Bahn and other train data sources
 * Uses v5.db.transport.rest API
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import { TrainJourney, Station, Departure, SearchResult, Stop, JourneyStatus } from './types';

// Deutsche Bahn API endpoints
const DB_API_BASE = 'https://v5.db.transport.rest';

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class TrainApi {
  private client: AxiosInstance;
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: DB_API_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.message);
        
        if (error.code === 'ECONNABORTED') {
          throw new ApiError('Request timed out. Please try again.', 'TIMEOUT', 408);
        }
        
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data as any;
          
          if (status === 404) {
            throw new ApiError('Station or journey not found.', 'NOT_FOUND', 404);
          }
          if (status === 429) {
            throw new ApiError('Too many requests. Please wait a moment.', 'RATE_LIMIT', 429);
          }
          if (status >= 500) {
            throw new ApiError('Server error. Please try again later.', 'SERVER_ERROR', status);
          }
          
          throw new ApiError(
            data?.message || 'An error occurred',
            data?.code || 'UNKNOWN_ERROR',
            status
          );
        }
        
        throw new ApiError('Network error. Check your connection.', 'NETWORK_ERROR');
      }
    );
  }

  /**
   * Deduplicate concurrent requests
   */
  private async dedupedRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key) as Promise<T>;
    }

    const promise = requestFn().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, promise);
    return promise;
  }

  /**
   * Search for stations by name
   */
  async searchStations(query: string): Promise<Station[]> {
    if (!query || query.length < 2) return [];

    return this.dedupedRequest(`stations:${query}`, async () => {
      try {
        const response = await this.client.get('/locations', {
          params: {
            query,
            fuzzy: true,
            results: 10,
            stops: true,
            addresses: false,
            poi: false,
          },
        });

        return response.data
          .filter((item: any) => item.type === 'stop' || item.type === 'station')
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            code: item.id,
            location: item.location,
          }));
      } catch (error) {
        console.error('Failed to search stations:', error);
        // Return mock data for development/fallback
        return this.getMockStations(query);
      }
    });
  }

  /**
   * Get departures for a specific station
   */
  async getDepartures(stationId: string): Promise<Departure[]> {
    if (!stationId) return [];

    return this.dedupedRequest(`departures:${stationId}`, async () => {
      try {
        const response = await this.client.get(`/stops/${encodeURIComponent(stationId)}/departures`, {
          params: {
            duration: 60,
            results: 20,
            remarks: true,
          },
        });

        return response.data
          .filter((item: any) => item.tripId && item.stop)
          .map((item: any) => this.mapDeparture(item));
      } catch (error) {
        console.error('Failed to get departures:', error);
        return this.getMockDepartures(stationId);
      }
    });
  }

  /**
   * Search for journeys between two stations
   */
  async searchJourneys(
    fromStationId: string,
    toStationId: string,
    date?: Date
  ): Promise<SearchResult> {
    if (!fromStationId || !toStationId) {
      throw new ApiError('Origin and destination required', 'INVALID_PARAMS');
    }

    return this.dedupedRequest(`journeys:${fromStationId}:${toStationId}:${date?.toISOString()}`, async () => {
      try {
        const departure = date || new Date();
        
        const response = await this.client.get('/journeys', {
          params: {
            from: fromStationId,
            to: toStationId,
            departure: departure.toISOString(),
            results: 5,
            stops: true,
            remarks: true,
          },
        });

        const journeys = response.data.journeys || [];
        
        return {
          from: { id: fromStationId, name: 'From Station' },
          to: { id: toStationId, name: 'To Station' },
          date: departure.toISOString(),
          journeys: journeys.map((j: any) => this.mapJourney(j)),
        };
      } catch (error) {
        console.error('Failed to search journeys:', error);
        return this.getMockJourneys(fromStationId, toStationId);
      }
    });
  }

  /**
   * Get journey details by trip ID
   */
  async getJourneyDetails(tripId: string): Promise<TrainJourney | null> {
    if (!tripId) return null;

    return this.dedupedRequest(`journey:${tripId}`, async () => {
      try {
        // For the DB API, we need to get the trip details
        const response = await this.client.get(`/trips/${encodeURIComponent(tripId)}`, {
          params: {
            remarks: true,
            stopovers: true,
          },
        });

        return this.mapTripToJourney(response.data);
      } catch (error) {
        console.error('Failed to get journey details:', error);
        return this.getMockJourney(tripId);
      }
    });
  }

  /**
   * Get trip details with real-time updates
   */
  async getTripDetails(tripId: string): Promise<any> {
    try {
      const response = await this.client.get(`/trips/${encodeURIComponent(tripId)}`, {
        params: {
          remarks: true,
          stopovers: true,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get trip details:', error);
      return null;
    }
  }

  // Helper methods to map API responses
  private mapDeparture(item: any): Departure {
    const scheduledTime = new Date(item.plannedWhen || item.when);
    const actualTime = item.when ? new Date(item.when) : null;
    const delayMinutes = item.delay ? Math.round(item.delay / 60) : 0;
    
    let status: JourneyStatus = 'ON_TIME';
    if (item.cancelled) {
      status = 'CANCELLED';
    } else if (delayMinutes > 0) {
      status = 'DELAYED';
    } else if (item.plannedPlatform && item.platform && item.plannedPlatform !== item.platform) {
      status = 'DELAYED';
    }

    return {
      id: item.tripId || `${item.line?.name}-${Date.now()}`,
      trainNumber: item.line?.name || 'Train',
      trainName: item.line?.productName || item.line?.mode?.toUpperCase(),
      destination: {
        id: item.direction?.id || 'unknown',
        name: item.direction?.name || item.direction || 'Unknown',
      },
      scheduledTime: scheduledTime.toISOString(),
      actualTime: actualTime?.toISOString(),
      platform: item.platform || item.plannedPlatform || '--',
      status,
      delayMinutes: delayMinutes > 0 ? delayMinutes : undefined,
      via: item.via || [],
    };
  }

  private mapJourney(journey: any): TrainJourney {
    const legs = journey.legs || [];
    const firstLeg = legs[0];
    const lastLeg = legs[legs.length - 1];

    const scheduledDeparture = new Date(firstLeg?.plannedDeparture || firstLeg?.departure);
    const actualDeparture = firstLeg?.departure ? new Date(firstLeg.departure) : null;
    const scheduledArrival = new Date(lastLeg?.plannedArrival || lastLeg?.arrival);
    const actualArrival = lastLeg?.arrival ? new Date(lastLeg.arrival) : null;

    const delayMinutes = firstLeg?.departureDelay 
      ? Math.round(firstLeg.departureDelay / 60) 
      : 0;

    let status: JourneyStatus = 'ON_TIME';
    if (firstLeg?.cancelled || lastLeg?.cancelled) {
      status = 'CANCELLED';
    } else if (delayMinutes > 5) {
      status = 'DELAYED';
    }

    // Calculate progress (mock for now)
    const now = new Date();
    let progress = 0;
    if (now < scheduledDeparture) {
      progress = 0;
    } else if (now > scheduledArrival) {
      progress = 100;
    } else {
      const total = scheduledArrival.getTime() - scheduledDeparture.getTime();
      const elapsed = now.getTime() - scheduledDeparture.getTime();
      progress = Math.round((elapsed / total) * 100);
    }

    return {
      id: journey.refreshToken || `${firstLeg?.tripId}-${Date.now()}`,
      trainNumber: firstLeg?.line?.name || 'Train',
      trainName: firstLeg?.line?.productName,
      operator: firstLeg?.line?.operator?.name,
      origin: {
        id: firstLeg?.origin?.id || 'origin',
        name: firstLeg?.origin?.name || 'Origin',
      },
      destination: {
        id: lastLeg?.destination?.id || 'destination',
        name: lastLeg?.destination?.name || 'Destination',
      },
      scheduledDeparture: scheduledDeparture.toISOString(),
      scheduledArrival: scheduledArrival.toISOString(),
      actualDeparture: actualDeparture?.toISOString(),
      actualArrival: actualArrival?.toISOString(),
      platform: firstLeg?.departurePlatform || '--',
      status,
      delayMinutes: delayMinutes > 0 ? delayMinutes : undefined,
      progress,
      stops: legs.flatMap((leg: any) => this.mapStops(leg.stopovers || [])),
    };
  }

  private mapTripToJourney(trip: any): TrainJourney {
    const stopovers = trip.stopovers || [];
    const origin = stopovers[0];
    const destination = stopovers[stopovers.length - 1];

    const scheduledDeparture = new Date(origin?.plannedDeparture?.date || origin?.departure?.date);
    const scheduledArrival = new Date(destination?.plannedArrival?.date || destination?.arrival?.date);

    // Calculate progress
    const now = new Date();
    let progress = 0;
    let status: JourneyStatus = 'SCHEDULED';

    if (now >= scheduledDeparture && now <= scheduledArrival) {
      status = 'DEPARTED';
      const total = scheduledArrival.getTime() - scheduledDeparture.getTime();
      const elapsed = now.getTime() - scheduledDeparture.getTime();
      progress = Math.round((elapsed / total) * 100);
    } else if (now > scheduledArrival) {
      status = 'ARRIVED';
      progress = 100;
    }

    return {
      id: trip.id || trip.tripId || `${Date.now()}`,
      trainNumber: trip.line?.name || trip.line?.fahrtNr || 'Train',
      trainName: trip.line?.productName,
      operator: trip.line?.operator?.name,
      origin: {
        id: origin?.stop?.id || 'origin',
        name: origin?.stop?.name || 'Origin',
      },
      destination: {
        id: destination?.stop?.id || 'destination',
        name: destination?.stop?.name || 'Destination',
      },
      scheduledDeparture: scheduledDeparture.toISOString(),
      scheduledArrival: scheduledArrival.toISOString(),
      platform: origin?.departurePlatform || '--',
      status,
      progress,
      stops: this.mapStops(stopovers),
    };
  }

  private mapStops(stopovers: any[]): Stop[] {
    return stopovers.map((stopover, index) => {
      const now = new Date();
      const arrival = new Date(stopover.arrival?.date || stopover.plannedArrival?.date);
      const departure = new Date(stopover.departure?.date || stopover.plannedDeparture?.date);

      let status: JourneyStatus = 'UNKNOWN';
      if (now > departure) {
        status = 'DEPARTED';
      } else if (now >= arrival && now <= departure) {
        status = 'BOARDING';
      } else if (index === 0 && now < arrival) {
        status = 'UNKNOWN';
      }

      return {
        station: {
          id: stopover.stop?.id || `stop-${index}`,
          name: stopover.stop?.name || `Stop ${index + 1}`,
        },
        scheduledArrival: stopover.plannedArrival?.date || stopover.arrival?.date,
        scheduledDeparture: stopover.plannedDeparture?.date || stopover.departure?.date,
        actualArrival: stopover.arrival?.date,
        actualDeparture: stopover.departure?.date,
        platform: stopover.arrivalPlatform || stopover.departurePlatform,
        status,
      };
    });
  }

  // Mock data for development/fallback
  private getMockStations(query: string): Station[] {
    const mockStations: Station[] = [
      { id: '8000096', name: 'Berlin Hauptbahnhof', code: 'BHF', country: 'DE' },
      { id: '8000261', name: 'München Hauptbahnhof', code: 'MH', country: 'DE' },
      { id: '8002549', name: 'Hamburg Hauptbahnhof', code: 'HH', country: 'DE' },
      { id: '8000105', name: 'Frankfurt (Main) Hbf', code: 'FF', country: 'DE' },
      { id: '8000207', name: 'Köln Hauptbahnhof', code: 'K', country: 'DE' },
      { id: '8000096', name: 'Stuttgart Hauptbahnhof', code: 'S', country: 'DE' },
      { id: '8000085', name: 'Düsseldorf Hauptbahnhof', code: 'D', country: 'DE' },
      { id: '8000152', name: 'Leipzig Hauptbahnhof', code: 'L', country: 'DE' },
    ];
    return mockStations.filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  private getMockDepartures(stationId: string): Departure[] {
    const now = new Date();
    return [
      {
        id: 'dep-1',
        trainNumber: 'ICE 123',
        trainName: 'ICE',
        destination: { id: '8000261', name: 'München Hbf' },
        scheduledTime: new Date(now.getTime() + 15 * 60000).toISOString(),
        platform: '5',
        status: 'ON_TIME',
      },
      {
        id: 'dep-2',
        trainNumber: 'RE 456',
        trainName: 'RE',
        destination: { id: '8002549', name: 'Hamburg Hbf' },
        scheduledTime: new Date(now.getTime() + 25 * 60000).toISOString(),
        actualTime: new Date(now.getTime() + 35 * 60000).toISOString(),
        platform: '3',
        status: 'DELAYED',
        delayMinutes: 10,
      },
      {
        id: 'dep-3',
        trainNumber: 'IC 789',
        trainName: 'IC',
        destination: { id: '8000105', name: 'Frankfurt Hbf' },
        scheduledTime: new Date(now.getTime() + 45 * 60000).toISOString(),
        platform: '8',
        status: 'ON_TIME',
      },
      {
        id: 'dep-4',
        trainNumber: 'ICE 512',
        trainName: 'ICE',
        destination: { id: '8000207', name: 'Köln Hbf' },
        scheduledTime: new Date(now.getTime() + 60 * 60000).toISOString(),
        platform: '12',
        status: 'BOARDING',
      },
    ];
  }

  private getMockJourneys(from: string, to: string): SearchResult {
    const fromStation = { id: from, name: 'Berlin Hbf' };
    const toStation = { id: to, name: 'München Hbf' };
    const now = new Date();

    return {
      from: fromStation,
      to: toStation,
      date: now.toISOString(),
      journeys: [
        {
          id: 'j-1',
          trainNumber: 'ICE 123',
          trainName: 'ICE',
          operator: 'DB Fernverkehr',
          origin: fromStation,
          destination: toStation,
          scheduledDeparture: new Date(now.getTime() + 30 * 60000).toISOString(),
          scheduledArrival: new Date(now.getTime() + 270 * 60000).toISOString(),
          platform: '5',
          status: 'ON_TIME',
          progress: 0,
        },
        {
          id: 'j-2',
          trainNumber: 'ICE 456',
          trainName: 'ICE',
          operator: 'DB Fernverkehr',
          origin: fromStation,
          destination: toStation,
          scheduledDeparture: new Date(now.getTime() + 90 * 60000).toISOString(),
          scheduledArrival: new Date(now.getTime() + 330 * 60000).toISOString(),
          platform: '7',
          status: 'DELAYED',
          delayMinutes: 15,
          progress: 0,
        },
      ],
    };
  }

  private getMockJourney(id: string): TrainJourney {
    const now = new Date();
    return {
      id,
      trainNumber: 'ICE 123',
      trainName: 'ICE',
      operator: 'DB Fernverkehr',
      origin: { id: '8000096', name: 'Berlin Hbf' },
      destination: { id: '8000261', name: 'München Hbf' },
      scheduledDeparture: new Date(now.getTime() - 60 * 60000).toISOString(),
      scheduledArrival: new Date(now.getTime() + 120 * 60000).toISOString(),
      actualDeparture: new Date(now.getTime() - 58 * 60000).toISOString(),
      platform: '5',
      status: 'DEPARTED',
      progress: 35,
      stops: [
        {
          station: { id: '8000096', name: 'Berlin Hbf' },
          scheduledArrival: new Date(now.getTime() - 60 * 60000).toISOString(),
          scheduledDeparture: new Date(now.getTime() - 60 * 60000).toISOString(),
          actualDeparture: new Date(now.getTime() - 58 * 60000).toISOString(),
          platform: '5',
          status: 'DEPARTED',
        },
        {
          station: { id: '8011160', name: 'Berlin Südkreuz' },
          scheduledArrival: new Date(now.getTime() - 45 * 60000).toISOString(),
          scheduledDeparture: new Date(now.getTime() - 43 * 60000).toISOString(),
          platform: '3',
          status: 'DEPARTED',
        },
        {
          station: { id: '8010159', name: 'Halle (Saale) Hbf' },
          scheduledArrival: new Date(now.getTime() - 5 * 60000).toISOString(),
          scheduledDeparture: new Date(now.getTime() + 2 * 60000).toISOString(),
          platform: '4',
          status: 'BOARDING',
        },
        {
          station: { id: '8000261', name: 'München Hbf' },
          scheduledArrival: new Date(now.getTime() + 120 * 60000).toISOString(),
          scheduledDeparture: new Date(now.getTime() + 120 * 60000).toISOString(),
          platform: '12',
          status: 'UNKNOWN',
        },
      ],
    };
  }
}

export const trainApi = new TrainApi();
export default trainApi;
