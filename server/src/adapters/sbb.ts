import { BaseTrainAdapter } from './base';
import { Station, Departure, Journey, TrainJourney, JourneyStatus } from '../types';

/**
 * Swiss Federal Railways (SBB/CFF/FFS) Adapter
 * Uses transport.opendata.ch - free, no auth required
 *
 * API Documentation: https://transport.opendata.ch/docs.html
 * Rate Limit: ~10 requests/second (be conservative)
 * Authentication: None required
 *
 * Endpoints:
 * - /v1/locations - Station search
 * - /v1/stationboard - Departures from a station
 * - /v1/connections - Journey planning (connections between stations)
 *
 * Note: transport.opendata.ch covers SBB and all Swiss public transport.
 * Uses DIDOK station IDs (e.g. 8503000 for Zurich HB).
 *
 * Caching Strategy:
 * - Stations: 24 hours
 * - Departures: 30 seconds
 * - Journeys: 5 minutes
 */

interface SBBStation {
  id: string;
  name: string;
  score: number | null;
  coordinate: {
    type: string;
    x: number;  // latitude
    y: number;  // longitude
  };
  distance: number | null;
  icon?: string;
}

interface SBBStationboardEntry {
  stop: {
    station: SBBStation;
    arrival: string | null;
    arrivalTimestamp: number | null;
    departure: string | null;
    departureTimestamp: number | null;
    delay: number;
    platform: string | null;
    prognosis: {
      platform: string | null;
      arrival: string | null;
      departure: string | null;
      capacity1st: number | null;
      capacity2nd: number | null;
    };
  };
  name: string;
  category: string;
  subcategory: string | null;
  categoryCode: number | null;
  number: string;
  operator: string;
  to: string;
  passList: Array<{
    station: SBBStation;
    arrival: string | null;
    departure: string | null;
    delay: number;
    platform: string | null;
  }>;
  capacity1st: number | null;
  capacity2nd: number | null;
}

interface SBBStationboardResponse {
  station: SBBStation;
  stationboard: SBBStationboardEntry[];
}

interface SBBConnection {
  from: {
    station: SBBStation;
    arrival: string | null;
    departure: string | null;
    delay: number | null;
    platform: string | null;
    prognosis: {
      platform: string | null;
      arrival: string | null;
      departure: string | null;
    };
  };
  to: {
    station: SBBStation;
    arrival: string | null;
    departure: string | null;
    delay: number | null;
    platform: string | null;
    prognosis: {
      platform: string | null;
      arrival: string | null;
      departure: string | null;
    };
  };
  duration: string;
  transfers: number;
  capacity1st: number | null;
  capacity2nd: number | null;
  sections: Array<{
    journey: {
      name: string;
      category: string;
      number: string;
      operator: string;
      to: string;
      passList: Array<{
        station: SBBStation;
        arrival: string | null;
        departure: string | null;
        delay: number;
        platform: string | null;
      }>;
    } | null;
    walk: { duration: number | null } | null;
    departure: {
      station: SBBStation;
      departure: string | null;
      platform: string | null;
    };
    arrival: {
      station: SBBStation;
      arrival: string | null;
      platform: string | null;
    };
  }>;
}

interface SBBConnectionsResponse {
  connections: SBBConnection[];
  from: SBBStation;
  to: SBBStation;
}

export class SBBAdapter extends BaseTrainAdapter {
  constructor() {
    // Free Swiss public transport API, no auth needed
    super('SBB', 'https://transport.opendata.ch/v1', 60);
    this.apiVersion = '1.0';
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/locations', {
        params: { query: 'Zurich', type: 'station' },
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('[SBB] Health check failed:', error);
      return false;
    }
  }

  async searchStations(query: string, limit: number = 10): Promise<Station[]> {
    const cacheKey = `sbb:stations:${query}:${limit}`;
    const cached = await this.getCached<Station[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<{ stations: SBBStation[] }>('/locations', {
        params: {
          query,
          type: 'station',
        },
      });

      const stations = response.data.stations
        .filter(s => s.id)
        .slice(0, limit)
        .map(s => ({
          id: s.id,
          name: s.name,
          country: 'CH',
          coordinates: {
            latitude: s.coordinate.x || 0,
            longitude: s.coordinate.y || 0,
          },
          timezone: 'Europe/Zurich',
        }));

      await this.setCached(cacheKey, stations, 86400);
      return stations;
    } catch (error) {
      console.error('[SBB] Error searching stations:', error);
      return [];
    }
  }

  async getDepartures(stationId: string, duration: number = 60): Promise<Departure[]> {
    const cacheKey = `sbb:departures:${stationId}:${duration}`;
    const cached = await this.getCached<Departure[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get<SBBStationboardResponse>('/stationboard', {
        params: {
          id: stationId,
          limit: 20,
          transportations: ['train', 'tram', 'bus', 'ship', 'cableway'],
        },
      });

      const stationData = response.data.station;
      const departures = response.data.stationboard.map(entry => ({
        tripId: `${entry.name}-${entry.stop.departureTimestamp || ''}`,
        stop: {
          id: stationData.id,
          name: stationData.name,
          country: 'CH',
          coordinates: {
            latitude: stationData.coordinate.x || 0,
            longitude: stationData.coordinate.y || 0,
          },
          timezone: 'Europe/Zurich',
        },
        when: entry.stop.prognosis.departure || entry.stop.departure || '',
        plannedWhen: entry.stop.departure || '',
        delay: entry.stop.delay || 0,
        platform: entry.stop.prognosis.platform || entry.stop.platform || '',
        plannedPlatform: entry.stop.platform || '',
        direction: entry.to,
        line: {
          id: entry.name,
          name: entry.name,
          product: entry.category,
          productName: `${entry.category} ${entry.number}`,
          mode: 'train',
          public: true,
        },
        remarks: [],
        cancelled: false,
      }));

      await this.setCached(cacheKey, departures, 30);
      return departures;
    } catch (error) {
      console.error('[SBB] Error getting departures:', error);
      return [];
    }
  }

  async searchJourneys(from: string, to: string, date?: string): Promise<Journey[]> {
    const departureTime = date || new Date().toISOString();
    const cacheKey = `sbb:journeys:${from}:${to}:${departureTime}`;
    const cached = await this.getCached<Journey[]>(cacheKey);
    if (cached) return cached;

    try {
      // transport.opendata.ch accepts station name or ID
      const response = await this.client.get<SBBConnectionsResponse>('/connections', {
        params: {
          from,
          to,
          date: departureTime.split('T')[0],
          time: departureTime.split('T')[1]?.substring(0, 5) || '',
          limit: 5,
        },
      });

      const journeys = response.data.connections.map((conn, index) => ({
        id: `sbb-${from}-${to}-${departureTime}-${index}`,
        type: 'journey',
        legs: conn.sections
          .filter(s => s.journey !== null)
          .map(section => ({
            origin: {
              id: section.departure.station.id,
              name: section.departure.station.name,
              departure: section.departure.departure || '',
              departurePlatform: section.departure.platform || '',
            },
            destination: {
              id: section.arrival.station.id,
              name: section.arrival.station.name,
              arrival: section.arrival.arrival || '',
              arrivalPlatform: section.arrival.platform || '',
            },
            line: {
              name: section.journey?.name || '',
              product: section.journey?.category || 'train',
            },
            remarks: [],
          })),
        price: undefined,
      }));

      await this.setCached(cacheKey, journeys, 300);
      return journeys;
    } catch (error) {
      console.error('[SBB] Error searching journeys:', error);
      return [];
    }
  }

  async getJourneyDetails(journeyId: string): Promise<TrainJourney | null> {
    // transport.opendata.ch doesn't have a direct trip lookup endpoint.
    // Journey details are embedded in the stationboard passList.
    // We cache whatever was previously fetched via searchJourneys.
    const cacheKey = `sbb:journey:${journeyId}`;
    const cached = await this.getCached<TrainJourney>(cacheKey);
    if (cached) return cached;

    console.warn('[SBB] getJourneyDetails: transport.opendata.ch does not support direct trip lookup');
    return null;
  }
}
