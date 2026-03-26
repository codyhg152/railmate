import { BaseTrainAdapter } from './base';
import { Station, Departure, Journey, TrainJourney, JourneyStatus } from '../types';

/**
 * Railtime.io Adapter
 * Provides real-time train information and webhook subscriptions for train updates
 * 
 * API Documentation: https://railtime.io/
 * Status: Active and maintained (last update: March 2025)
 * 
 * Features:
 * - Station search by name or UIC code
 * - Real-time train information
 * - Webhook subscriptions for automatic updates
 * - Multi-source data (NS, DB, SNCB, etc.)
 * 
 * Authentication: API key required (X-Railtime-Api-Secret header)
 * Rate Limit: Depends on subscription tier
 * 
 * Caching Strategy:
 * - Stations: 24 hours
 * - Departures: 30 seconds
 * - Station Details: 1 hour
 */

interface RailtimeStation {
  score: number;
  station: {
    uicCode: string;
    sncfuicCode: string;
    sncfCode: string;
    dbCode: string;
    obbCode: string;
    renfeCode: string;
    atocCode: string;
    amtrakCode: string | null;
    name: string;
    countryCode: string;
    geoData: {
      latitude: string;
      longitude: string;
    };
    isMainStation: boolean;
    isAirport: boolean;
  };
}

interface RailtimeStationDetails {
  station: {
    uicCode: string;
    sncfuicCode: string;
    sncfCode: string;
    dbCode: string;
    obbCode: string;
    renfeCode: string;
    atocCode: string;
    amtrakCode: string | null;
    name: string;
    geoData: {
      countryCode: string;
      latitude: string;
      longitude: string;
    };
    isAirport: boolean;
  };
  nearby?: Array<{
    name: string;
    type: string;
    category: string;
    geoData: {
      countryCode: string;
      latitude: string;
      longitude: string;
    };
  }>;
}

interface RailtimeSubscriptionRequest {
  CodeQualifier: 'UICCode';
  DepartureCode: string;
  ScheduledDepartureDateTime: string;
  ArrivalCode: string;
  ScheduledArrivalDateTime: string;
  ReplyAddress: string;
  ExternalIdentifier?: string;
}

interface RailtimeChangePayload {
  Key: string;
  TimeStamp: string;
  ChangeTypes: string[];
  DepartureUICCode: string;
  ArrivalUICCode: string;
  Scheduled: {
    DepartureDateTime: string;
    DeparturePlatform: string | null;
    ArrivalDateTime: string;
    ArrivalPlatform: string | null;
    TripDetails: {
      Status: string;
      TrainNumber: string | null;
      DurationInMinutes: number;
    };
  };
  Actual: {
    DepartureDateTime: string;
    DeparturePlatform: string | null;
    ArrivalDateTime: string;
    ArrivalPlatform: string | null;
    TripDetails: {
      Status: string;
      TrainNumber: string | null;
      DurationInMinutes: number;
    };
  };
  Appendix: {
    Stations: Array<{
      Name: string;
      References: {
        UICCode: string;
        SNCFUICCode: string;
        SNCFCode: string;
        DBCode: string;
        OBBCode: string;
        RenfeCode: string;
      };
      Location: {
        CountryCode: string;
        Latitude: string;
        Longitude: string;
      };
      Miscellaneous: {
        IsMainStation: boolean;
        IsAirport: boolean;
      };
    }>;
  };
  Sources: string[];
  External: {
    Identifier?: string;
  };
}

export class RailtimeAdapter extends BaseTrainAdapter {
  private apiSecret: string;

  constructor(apiSecret: string = '') {
    super('Railtime', 'https://railtime.io', 100);
    this.apiVersion = '1.0';
    this.apiSecret = apiSecret;
    
    if (apiSecret) {
      // Set default headers for all requests
      this.client.defaults.headers.common['X-Railtime-Api-Secret'] = apiSecret;
      this.client.defaults.headers.common['X-Railtime-Version'] = '1.0';
    }
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<boolean> {
    if (!this.apiSecret) return false;
    
    try {
      const response = await this.client.get('/api/1.0/search/berlin', {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('[Railtime] Health check failed:', error);
      return false;
    }
  }

  async searchStations(query: string, limit: number = 10): Promise<Station[]> {
    if (!this.apiSecret) {
      console.warn('[Railtime] No API secret provided');
      return [];
    }

    const cacheKey = `railtime:stations:${query}:${limit}`;
    const cached = await this.getCached<Station[]>(cacheKey);
    if (cached) return cached;

    try {
      // Railtime search endpoint returns up to 20 stations with score >= 40
      const response = await this.client.get<RailtimeStation[]>(`/api/1.0/search/${encodeURIComponent(query)}`, {
        headers: {
          'X-Railtime-Api-Secret': this.apiSecret,
          'X-Railtime-Version': '1.0',
        },
      });

      const stations = response.data
        .slice(0, limit)
        .map(item => ({
          id: item.station.uicCode,
          name: item.station.name,
          country: item.station.countryCode,
          coordinates: {
            latitude: parseFloat(item.station.geoData.latitude) || 0,
            longitude: parseFloat(item.station.geoData.longitude) || 0,
          },
          timezone: this.getTimezoneForCountry(item.station.countryCode),
        }));

      await this.setCached(cacheKey, stations, 86400); // 24 hours
      return stations;
    } catch (error) {
      console.error('[Railtime] Error searching stations:', error);
      return [];
    }
  }

  /**
   * Get station details by name or UIC code
   */
  async getStationDetails(identifier: string, type: 'name' | 'uic' = 'name'): Promise<RailtimeStationDetails | null> {
    if (!this.apiSecret) {
      console.warn('[Railtime] No API secret provided');
      return null;
    }

    const cacheKey = `railtime:station:${type}:${identifier}`;
    const cached = await this.getCached<RailtimeStationDetails>(cacheKey);
    if (cached) return cached;

    try {
      const endpoint = type === 'name' 
        ? `/api/1.0/station/${encodeURIComponent(identifier)}`
        : `/api/1.0/station/uic/${identifier}`;

      const response = await this.client.get<RailtimeStationDetails>(endpoint, {
        headers: {
          'X-Railtime-Api-Secret': this.apiSecret,
          'X-Railtime-Version': '1.0',
        },
      });

      await this.setCached(cacheKey, response.data, 3600); // 1 hour
      return response.data;
    } catch (error) {
      console.error('[Railtime] Error getting station details:', error);
      return null;
    }
  }

  async getDepartures(stationId: string, duration: number = 60): Promise<Departure[]> {
    // Railtime.io doesn't have a direct departures endpoint
    // This would need to be implemented via subscription webhooks
    // or by using another data source
    console.warn('[Railtime] Direct departures not available - use subscription webhooks');
    return [];
  }

  async searchJourneys(from: string, to: string, date?: string): Promise<Journey[]> {
    // Railtime.io doesn't have a journey planner
    // Use other adapters for journey planning
    console.warn('[Railtime] Journey planning not available');
    return [];
  }

  async getJourneyDetails(journeyId: string): Promise<TrainJourney | null> {
    // Railtime.io uses subscription-based updates
    // Journey details would come from webhook callbacks
    console.warn('[Railtime] Use webhook subscriptions for journey tracking');
    return null;
  }

  /**
   * Subscribe to train updates via webhook
   * Railtime will send POST requests to the ReplyAddress when changes are detected
   * 
   * @param subscription Subscription request details
   * @returns Subscription key or null if failed
   */
  async subscribeToUpdates(subscription: RailtimeSubscriptionRequest): Promise<string | null> {
    if (!this.apiSecret) {
      console.warn('[Railtime] No API secret provided');
      return null;
    }

    try {
      const response = await this.client.post('/api/1.0/subscribe', subscription, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Railtime-Api-Secret': this.apiSecret,
          'X-Railtime-Version': '1.0',
        },
      });

      // Returns subscription key as plain text
      if (response.status === 202 && response.data) {
        console.log('[Railtime] Subscription created:', response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('[Railtime] Error creating subscription:', error);
      return null;
    }
  }

  /**
   * Cancel a subscription
   * @param key Subscription key returned from subscribeToUpdates
   */
  async cancelSubscription(key: string): Promise<boolean> {
    if (!this.apiSecret) {
      console.warn('[Railtime] No API secret provided');
      return false;
    }

    try {
      const response = await this.client.delete(`/api/1.0/subscribe/${encodeURIComponent(key)}`, {
        headers: {
          'X-Railtime-Api-Secret': this.apiSecret,
          'X-Railtime-Version': '1.0',
        },
      });

      return response.status === 202;
    } catch (error) {
      console.error('[Railtime] Error canceling subscription:', error);
      return false;
    }
  }

  /**
   * Process webhook payload from Railtime
   * This should be called by your webhook endpoint when Railtime sends updates
   * 
   * @param payload The JSON payload received from Railtime
   * @returns Parsed change information
   */
  processWebhookPayload(payload: RailtimeChangePayload): {
    key: string;
    timestamp: Date;
    changeTypes: string[];
    departureStation: string;
    arrivalStation: string;
    scheduled: {
      departure: Date;
      arrival: Date;
      platform?: string;
      status: string;
      trainNumber?: string;
    };
    actual: {
      departure: Date;
      arrival: Date;
      platform?: string;
      status: string;
      trainNumber?: string;
    };
    externalIdentifier?: string;
  } {
    const departureStation = payload.Appendix.Stations.find(
      s => s.References.UICCode === payload.DepartureUICCode
    );
    const arrivalStation = payload.Appendix.Stations.find(
      s => s.References.UICCode === payload.ArrivalUICCode
    );

    return {
      key: payload.Key,
      timestamp: new Date(payload.TimeStamp),
      changeTypes: payload.ChangeTypes,
      departureStation: departureStation?.Name || payload.DepartureUICCode,
      arrivalStation: arrivalStation?.Name || payload.ArrivalUICCode,
      scheduled: {
        departure: new Date(payload.Scheduled.DepartureDateTime),
        arrival: new Date(payload.Scheduled.ArrivalDateTime),
        platform: payload.Scheduled.DeparturePlatform || undefined,
        status: payload.Scheduled.TripDetails.Status,
        trainNumber: payload.Scheduled.TripDetails.TrainNumber || undefined,
      },
      actual: {
        departure: new Date(payload.Actual.DepartureDateTime),
        arrival: new Date(payload.Actual.ArrivalDateTime),
        platform: payload.Actual.DeparturePlatform || undefined,
        status: payload.Actual.TripDetails.Status,
        trainNumber: payload.Actual.TripDetails.TrainNumber || undefined,
      },
      externalIdentifier: payload.External.Identifier,
    };
  }

  /**
   * Get timezone for country code
   */
  private getTimezoneForCountry(countryCode: string): string {
    const timezones: Record<string, string> = {
      'DE': 'Europe/Berlin',
      'FR': 'Europe/Paris',
      'GB': 'Europe/London',
      'NL': 'Europe/Amsterdam',
      'BE': 'Europe/Brussels',
      'AT': 'Europe/Vienna',
      'CH': 'Europe/Zurich',
      'IT': 'Europe/Rome',
      'ES': 'Europe/Madrid',
      'PL': 'Europe/Warsaw',
      'CZ': 'Europe/Prague',
      'DK': 'Europe/Copenhagen',
      'SE': 'Europe/Stockholm',
      'NO': 'Europe/Oslo',
      'FI': 'Europe/Helsinki',
    };
    return timezones[countryCode] || 'Europe/UTC';
  }

  /**
   * Convert Railtime station to standard Station format
   */
  private convertStation(railtimeStation: RailtimeStation['station']): Station {
    return {
      id: railtimeStation.uicCode,
      name: railtimeStation.name,
      country: railtimeStation.countryCode,
      coordinates: {
        latitude: parseFloat(railtimeStation.geoData.latitude) || 0,
        longitude: parseFloat(railtimeStation.geoData.longitude) || 0,
      },
      timezone: this.getTimezoneForCountry(railtimeStation.countryCode),
    };
  }
}

export { RailtimeSubscriptionRequest, RailtimeChangePayload };
