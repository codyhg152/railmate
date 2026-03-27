/**
 * API client for Railmate backend
 * Uses our centralized API server
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import { TrainJourney, Station, Departure, SearchResult, JourneyStatus } from './types';

// Railmate API endpoint - update this to your server URL
const API_BASE = 'http://192.168.1.50:3000'; // Local server IP

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

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
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
            data?.error || 'An error occurred',
            data?.code || 'UNKNOWN_ERROR',
            status
          );
        }
        
        throw new ApiError('Network error. Check your connection.', 'NETWORK_ERROR');
      }
    );
  }

  /**
   * Search for stations by name
   */
  async searchStations(query: string): Promise<Station[]> {
    if (!query || query.length < 2) return [];

    try {
      const response = await this.client.get('/api/stations/search', {
        params: { query },
      });
      return response.data.stations || [];
    } catch (error) {
      console.error('Failed to search stations:', error);
      return this.getMockStations(query);
    }
  }

  /**
   * Get departures for a specific station
   */
  async getDepartures(stationId: string, network: string = 'deutschebahn'): Promise<Departure[]> {
    if (!stationId) return [];

    try {
      const response = await this.client.get(`/api/stations/${network}/${stationId}/departures`);
      return response.data.departures || [];
    } catch (error) {
      console.error('Failed to get departures:', error);
      return this.getMockDepartures(stationId);
    }
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

    try {
      const response = await this.client.get('/api/journeys/search', {
        params: {
          from: fromStationId,
          to: toStationId,
          date: date?.toISOString(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search journeys:', error);
      return this.getMockJourneys(fromStationId, toStationId);
    }
  }

  /**
   * Get journey details by trip ID
   */
  async getJourneyDetails(tripId: string): Promise<TrainJourney | null> {
    if (!tripId) return null;

    try {
      const response = await this.client.get(`/api/journeys/${tripId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get journey details:', error);
      return this.getMockJourney(tripId);
    }
  }

  // Mock data for fallback
  private getMockStations(query: string): Station[] {
    const mockStations: Station[] = [
      { id: '8000096', name: 'Berlin Hauptbahnhof', code: 'BHF', country: 'DE' },
      { id: '8000261', name: 'München Hauptbahnhof', code: 'MH', country: 'DE' },
      { id: '8002549', name: 'Hamburg Hauptbahnhof', code: 'HH', country: 'DE' },
      { id: '8000105', name: 'Frankfurt (Main) Hbf', code: 'FF', country: 'DE' },
      { id: '8000207', name: 'Köln Hauptbahnhof', code: 'K', country: 'DE' },
    ];
    return mockStations.filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  private getMockDepartures(stationId: string): any[] {
    const now = new Date();
    return [
      {
        id: 'dep-1',
        trainNumber: 'ICE 123',
        trainName: 'ICE',
        destination: { id: '8000261', name: 'München Hbf' },
        scheduledTime: new Date(now.getTime() + 15 * 60000).toISOString(),
        platform: '5',
        status: 'ON_TIME' as JourneyStatus,
      },
      {
        id: 'dep-2',
        trainNumber: 'RE 456',
        trainName: 'RE',
        destination: { id: '8002549', name: 'Hamburg Hbf' },
        scheduledTime: new Date(now.getTime() + 25 * 60000).toISOString(),
        actualTime: new Date(now.getTime() + 35 * 60000).toISOString(),
        platform: '3',
        status: 'DELAYED' as JourneyStatus,
        delayMinutes: 10,
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
          status: 'ON_TIME' as JourneyStatus,
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
      status: 'DEPARTED' as JourneyStatus,
      progress: 35,
      stops: [],
    };
  }
}

export const trainApi = new TrainApi();
export default trainApi;
