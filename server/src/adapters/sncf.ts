import { BaseTrainAdapter } from './base';
import { Station, Departure, Journey, TrainJourney, JourneyStatus } from '../types';

/**
 * SNCF Adapter (France)
 * Uses Navitia API format via api.sncf.com
 * 
 * API Documentation: https://doc.navitia.io/
 * Rate Limit: Depends on API tier (default: 100/min)
 * 
 * Authentication: HTTP Basic Auth with token as username, empty password
 * Base URL: https://api.sncf.com/v1/coverage/sncf
 * 
 * Endpoints:
 * - /coverage/sncf/places - Station search
 * - /coverage/sncf/stop_points/{id}/departures - Departures
 * - /coverage/sncf/journeys - Journey planning
 * 
 * Caching Strategy:
 * - Stations: 24 hours
 * - Departures: 30 seconds
 * - Journeys: 5 minutes
 * - Journey Details: 10 seconds
 */

interface SNCFPlace {
  id: string;
  name: string;
  embedded_type: string;
  stop_area?: {
    id: string;
    name: string;
    coord: {
      lat: string;
      lon: string;
    };
    administrative_regions?: Array<{
      id: string;
      name: string;
      level: number;
    }>;
  };
}

interface SNCFDeparture {
  display_informations: {
    direction: string;
    label: string;
    network: string;
    physical_mode: string;
    trip_short_name: string;
  };
  stop_date_time: {
    arrival_date_time: string;
    departure_date_time: string;
    base_arrival_date_time?: string;
    base_departure_date_time?: string;
  };
  stop_point: {
    id: string;
    name: string;
    coord: {
      lat: string;
      lon: string;
    };
  };
  route: {
    id: string;
    direction: {
      id: string;
      name: string;
    };
  };
}

interface SNCFJourney {
  duration: number;
  nb_transfers: number;
  departure_date_time: string;
  arrival_date_time: string;
  sections: Array<{
    type: string;
    duration: number;
    from?: any;
    to?: any;
    display_informations?: any;
  }>;
}

interface SNCFDisruption {
  id: string;
  status: string;
  severity: {
    name: string;
    effect: string;
  };
  messages?: Array<{
    text: string;
  }>;
}

export class SNCFAdapter extends BaseTrainAdapter {
  private apiToken: string;

  constructor(apiToken: string = '') {
    // Base URL includes coverage/sncf for SNCF-specific data
    super('SNCF', 'https://api.sncf.com/v1/coverage/sncf', 100);
    this.apiVersion = '1.0';
    this.apiToken = apiToken;
    
    if (apiToken) {
      // Navitia uses HTTP Basic Auth with token as username
      this.client.defaults.auth = {
        username: apiToken,
        password: '',
      };
    }
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<boolean> {
    if (!this.apiToken) return false;
    
    try {
      const response = await this.client.get('/places', {
        params: { q: 'Paris', count: 1 },
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('[SNCF] Health check failed:', error);
      return false;
    }
  }

  async searchStations(query: string, limit: number = 10): Promise<Station[]> {
    if (!this.apiToken) {
      console.warn('[SNCF] No API token provided');
      return [];
    }

    const cacheKey = `sncf:stations:${query}:${limit}`;
    const cached = await this.getCached<Station[]>(cacheKey);
    if (cached) return cached;

    try {
      // Navitia places endpoint for station search
      const response = await this.client.get<{ places: SNCFPlace[] }>('/places', {
        params: { 
          q: query, 
          count: limit,
          type: ['stop_area'], // Only search for stations
        },
      });

      const stations = response.data.places
        .filter(place => place.embedded_type === 'stop_area')
        .map(place => {
          const stopArea = place.stop_area!;
          return {
            id: stopArea.id,
            name: stopArea.name,
            country: 'FR',
            coordinates: {
              latitude: parseFloat(stopArea.coord.lat) || 0,
              longitude: parseFloat(stopArea.coord.lon) || 0,
            },
            timezone: 'Europe/Paris',
          };
        });

      await this.setCached(cacheKey, stations, 86400); // 24 hours
      return stations;
    } catch (error) {
      console.error('[SNCF] Error searching stations:', error);
      return [];
    }
  }

  async getDepartures(stationId: string, duration: number = 60): Promise<Departure[]> {
    if (!this.apiToken) {
      console.warn('[SNCF] No API token provided');
      return [];
    }
    
    const cacheKey = `sncf:departures:${stationId}:${duration}`;
    const cached = await this.getCached<Departure[]>(cacheKey);
    if (cached) return cached;

    try {
      // Calculate datetime for duration
      const fromDatetime = new Date().toISOString().replace(/\..*$/, '');
      
      // SNCF API endpoint for departures
      const response = await this.client.get<{ departures: SNCFDeparture[] }>(
        `/stop_points/${stationId}/departures`,
        {
          params: { 
            from_datetime: fromDatetime,
            duration: duration * 60, // Convert to seconds
            count: 20,
            depth: 0,
          },
        }
      );

      const departures = response.data.departures.map(dep => {
        // Calculate delay if base time is available
        let delay = 0;
        if (dep.stop_date_time.base_departure_date_time) {
          const planned = new Date(dep.stop_date_time.base_departure_date_time);
          const actual = new Date(dep.stop_date_time.departure_date_time);
          delay = Math.max(0, (actual.getTime() - planned.getTime()) / 1000 / 60);
        }

        return {
          tripId: dep.display_informations.trip_short_name || '',
          stop: {
            id: dep.stop_point.id,
            name: dep.stop_point.name,
            country: 'FR',
            coordinates: {
              latitude: parseFloat(dep.stop_point.coord.lat) || 0,
              longitude: parseFloat(dep.stop_point.coord.lon) || 0,
            },
            timezone: 'Europe/Paris',
          },
          when: dep.stop_date_time.departure_date_time,
          plannedWhen: dep.stop_date_time.base_departure_date_time || dep.stop_date_time.departure_date_time,
          delay,
          platform: '', // SNCF doesn't always provide platform info
          plannedPlatform: '',
          direction: dep.display_informations.direction,
          line: {
            id: dep.display_informations.label,
            name: dep.display_informations.label,
            product: dep.display_informations.physical_mode,
            productName: dep.display_informations.label,
            mode: 'train',
            public: true,
          },
          remarks: [],
          cancelled: false,
        };
      });

      await this.setCached(cacheKey, departures, 30); // 30 seconds
      return departures;
    } catch (error) {
      console.error('[SNCF] Error getting departures:', error);
      return [];
    }
  }

  async searchJourneys(from: string, to: string, date?: string): Promise<Journey[]> {
    if (!this.apiToken) {
      console.warn('[SNCF] No API token provided');
      return [];
    }
    
    const departureTime = date || new Date().toISOString().replace(/\..*$/, '');
    const cacheKey = `sncf:journeys:${from}:${to}:${departureTime}`;
    const cached = await this.getCached<Journey[]>(cacheKey);
    if (cached) return cached;

    try {
      // SNCF API endpoint for journey planning
      const response = await this.client.get<{ journeys: SNCFJourney[] }>('/journeys', {
        params: {
          from,
          to,
          datetime: departureTime,
          count: 5,
          min_nb_transfers: 0,
          max_nb_transfers: 5,
        },
      });

      const journeys = response.data.journeys.map((journey, index) => ({
        id: `sncf-${from}-${to}-${departureTime}-${index}`,
        type: 'journey',
        legs: journey.sections
          .filter(section => section.type === 'public_transport')
          .map(section => ({
            origin: section.from,
            destination: section.to,
            line: section.display_informations || { name: 'Unknown', product: 'train' },
            remarks: [],
          })),
        price: undefined,
      }));

      await this.setCached(cacheKey, journeys, 300); // 5 minutes
      return journeys;
    } catch (error) {
      console.error('[SNCF] Error searching journeys:', error);
      return [];
    }
  }

  async getJourneyDetails(journeyId: string): Promise<TrainJourney | null> {
    if (!this.apiToken) {
      console.warn('[SNCF] No API token provided');
      return null;
    }
    
    const cacheKey = `sncf:journey:${journeyId}`;
    const cached = await this.getCached<TrainJourney>(cacheKey);
    if (cached) return cached;

    try {
      // SNCF uses vehicle_journeys endpoint for trip details
      const response = await this.client.get(`/vehicle_journeys/${journeyId}`);
      const vehicleJourney = response.data;

      if (!vehicleJourney || !vehicleJourney.stop_times) {
        return null;
      }

      const stops = vehicleJourney.stop_times;
      const firstStop = stops[0];
      const lastStop = stops[stops.length - 1];

      const trainJourney: TrainJourney = {
        id: journeyId,
        operator: 'SNCF',
        trainNumber: vehicleJourney.display_informations?.trip_short_name || '',
        trainType: vehicleJourney.display_informations?.physical_mode || '',
        origin: {
          id: firstStop.stop_point?.id || '',
          name: firstStop.stop_point?.name || '',
          country: 'FR',
          coordinates: {
            latitude: parseFloat(firstStop.stop_point?.coord?.lat) || 0,
            longitude: parseFloat(firstStop.stop_point?.coord?.lon) || 0,
          },
          timezone: 'Europe/Paris',
        },
        destination: {
          id: lastStop.stop_point?.id || '',
          name: lastStop.stop_point?.name || '',
          country: 'FR',
          coordinates: {
            latitude: parseFloat(lastStop.stop_point?.coord?.lat) || 0,
            longitude: parseFloat(lastStop.stop_point?.coord?.lon) || 0,
          },
          timezone: 'Europe/Paris',
        },
        scheduledDeparture: firstStop.departure_time || '',
        actualDeparture: firstStop.departure_time || '',
        departureDelay: 0,
        departurePlatform: '',
        scheduledArrival: lastStop.arrival_time || '',
        actualArrival: lastStop.arrival_time || '',
        arrivalDelay: 0,
        arrivalPlatform: '',
        status: JourneyStatus.SCHEDULED,
        stops: stops.map((stop: any) => ({
          stop: stop.stop_point,
          arrival: stop.arrival_time,
          departure: stop.departure_time,
        })),
        amenities: [],
        cancelled: false,
      };

      await this.setCached(cacheKey, trainJourney, 10); // 10 seconds
      return trainJourney;
    } catch (error) {
      console.error('[SNCF] Error getting journey details:', error);
      return null;
    }
  }

  /**
   * Get disruptions for a specific line or network
   * SNCF-specific method
   */
  async getDisruptions(): Promise<SNCFDisruption[]> {
    if (!this.apiToken) return [];

    try {
      const response = await this.client.get<{ disruptions: SNCFDisruption[] }>('/disruptions');
      return response.data.disruptions || [];
    } catch (error) {
      console.error('[SNCF] Error getting disruptions:', error);
      return [];
    }
  }
}
