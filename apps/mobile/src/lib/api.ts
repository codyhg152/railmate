/**
 * API client for Deutsche Bahn and other train data sources
 */
import axios, { AxiosInstance } from 'axios';
import { TrainJourney, Station, Departure, SearchResult } from './types';

// Deutsche Bahn API endpoints
const DB_API_BASE = 'https://bahn.expert/api';

class TrainApi {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: DB_API_BASE,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search for stations by name
   */
  async searchStations(query: string): Promise<Station[]> {
    try {
      const response = await this.client.get('/stations', {
        params: { search: query },
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to search stations:', error);
      // Return mock data for development
      return this.getMockStations(query);
    }
  }

  /**
   * Get departures for a specific station
   */
  async getDepartures(stationId: string): Promise<Departure[]> {
    try {
      const response = await this.client.get(`/departures/${stationId}`);
      return response.data || [];
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
    try {
      const response = await this.client.get('/journeys', {
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
   * Get journey details by ID
   */
  async getJourneyDetails(journeyId: string): Promise<TrainJourney | null> {
    try {
      const response = await this.client.get(`/journey/${journeyId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get journey details:', error);
      return this.getMockJourney(journeyId);
    }
  }

  // Mock data for development
  private getMockStations(query: string): Station[] {
    const mockStations: Station[] = [
      { id: '1', name: 'Berlin Hauptbahnhof', code: 'BHF', country: 'DE' },
      { id: '2', name: 'München Hauptbahnhof', code: 'MH', country: 'DE' },
      { id: '3', name: 'Hamburg Hauptbahnhof', code: 'HH', country: 'DE' },
      { id: '4', name: 'Frankfurt Hauptbahnhof', code: 'FF', country: 'DE' },
      { id: '5', name: 'Köln Hauptbahnhof', code: 'K', country: 'DE' },
      { id: '6', name: 'Stuttgart Hauptbahnhof', code: 'S', country: 'DE' },
      { id: '7', name: 'Düsseldorf Hauptbahnhof', code: 'D', country: 'DE' },
      { id: '8', name: 'Leipzig Hauptbahnhof', code: 'L', country: 'DE' },
    ];
    return mockStations.filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  private getMockDepartures(stationId: string): Departure[] {
    return [
      {
        id: 'dep-1',
        trainNumber: 'ICE 123',
        trainName: 'ICE',
        destination: { id: '2', name: 'München Hbf' },
        scheduledTime: new Date(Date.now() + 15 * 60000).toISOString(),
        platform: '5',
        status: 'ON_TIME',
      },
      {
        id: 'dep-2',
        trainNumber: 'RE 456',
        trainName: 'RE',
        destination: { id: '3', name: 'Hamburg Hbf' },
        scheduledTime: new Date(Date.now() + 25 * 60000).toISOString(),
        actualTime: new Date(Date.now() + 35 * 60000).toISOString(),
        platform: '3',
        status: 'DELAYED',
        delayMinutes: 10,
      },
      {
        id: 'dep-3',
        trainNumber: 'IC 789',
        trainName: 'IC',
        destination: { id: '4', name: 'Frankfurt Hbf' },
        scheduledTime: new Date(Date.now() + 45 * 60000).toISOString(),
        platform: '8',
        status: 'ON_TIME',
      },
    ];
  }

  private getMockJourneys(from: string, to: string): SearchResult {
    const fromStation = { id: from, name: 'Berlin Hbf' };
    const toStation = { id: to, name: 'München Hbf' };

    return {
      from: fromStation,
      to: toStation,
      date: new Date().toISOString(),
      journeys: [
        {
          id: 'j-1',
          trainNumber: 'ICE 123',
          trainName: 'ICE',
          operator: 'DB Fernverkehr',
          origin: fromStation,
          destination: toStation,
          scheduledDeparture: new Date(Date.now() + 30 * 60000).toISOString(),
          scheduledArrival: new Date(Date.now() + 270 * 60000).toISOString(),
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
          scheduledDeparture: new Date(Date.now() + 90 * 60000).toISOString(),
          scheduledArrival: new Date(Date.now() + 330 * 60000).toISOString(),
          platform: '7',
          status: 'DELAYED',
          delayMinutes: 15,
          progress: 0,
        },
      ],
    };
  }

  private getMockJourney(id: string): TrainJourney {
    return {
      id,
      trainNumber: 'ICE 123',
      trainName: 'ICE',
      operator: 'DB Fernverkehr',
      origin: { id: '1', name: 'Berlin Hbf' },
      destination: { id: '2', name: 'München Hbf' },
      scheduledDeparture: new Date(Date.now() - 60 * 60000).toISOString(),
      scheduledArrival: new Date(Date.now() + 120 * 60000).toISOString(),
      actualDeparture: new Date(Date.now() - 58 * 60000).toISOString(),
      platform: '5',
      status: 'DEPARTED',
      progress: 35,
      stops: [
        {
          station: { id: '1', name: 'Berlin Hbf' },
          scheduledArrival: new Date(Date.now() - 60 * 60000).toISOString(),
          scheduledDeparture: new Date(Date.now() - 60 * 60000).toISOString(),
          actualDeparture: new Date(Date.now() - 58 * 60000).toISOString(),
          platform: '5',
          status: 'DEPARTED',
        },
        {
          station: { id: '1a', name: 'Berlin Südkreuz' },
          scheduledArrival: new Date(Date.now() - 45 * 60000).toISOString(),
          scheduledDeparture: new Date(Date.now() - 43 * 60000).toISOString(),
          platform: '3',
          status: 'DEPARTED',
        },
        {
          station: { id: '1b', name: 'Halle (Saale)' },
          scheduledArrival: new Date(Date.now() - 5 * 60000).toISOString(),
          scheduledDeparture: new Date(Date.now() + 2 * 60000).toISOString(),
          platform: '4',
          status: 'BOARDING',
        },
        {
          station: { id: '2', name: 'München Hbf' },
          scheduledArrival: new Date(Date.now() + 120 * 60000).toISOString(),
          scheduledDeparture: new Date(Date.now() + 120 * 60000).toISOString(),
          platform: '12',
          status: 'UNKNOWN',
        },
      ],
    };
  }
}

export const trainApi = new TrainApi();
export default trainApi;
