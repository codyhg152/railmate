import { DeutscheBahnAdapter } from '../adapters/deutschebahn';
import { SNCFAdapter } from '../adapters/sncf';
import { NationalRailAdapter } from '../adapters/nationalrail';
import { BaseTrainAdapter } from '../adapters/base';
import { Station, Departure, Journey, TrainJourney } from '../types';

export class TrainDataService {
  private adapters: Map<string, BaseTrainAdapter> = new Map();

  constructor() {
    // Initialize adapters
    this.adapters.set('de', new DeutscheBahnAdapter());
    this.adapters.set('fr', new SNCFAdapter(process.env.SNCF_API_TOKEN));
    this.adapters.set('gb', new NationalRailAdapter(process.env.NATIONAL_RAIL_API_TOKEN));
  }

  private getAdapterForCountry(country: string): BaseTrainAdapter | undefined {
    return this.adapters.get(country.toLowerCase());
  }

  private getPrimaryAdapter(): BaseTrainAdapter {
    return this.adapters.get('de')!; // Deutsche Bahn as primary
  }

  async searchStations(query: string, country?: string, limit: number = 10): Promise<Station[]> {
    if (country) {
      const adapter = this.getAdapterForCountry(country);
      if (adapter) {
        return adapter.searchStations(query, limit);
      }
    }

    // Search across all adapters
    const results: Station[] = [];
    const promises = Array.from(this.adapters.values()).map(async (adapter) => {
      try {
        const stations = await adapter.searchStations(query, limit);
        results.push(...stations);
      } catch (error) {
        console.error(`Error searching stations with ${adapter.name}:`, error);
      }
    });

    await Promise.all(promises);
    
    // Remove duplicates by ID and sort by relevance
    const unique = new Map<string, Station>();
    results.forEach(station => {
      if (!unique.has(station.id)) {
        unique.set(station.id, station);
      }
    });
    
    return Array.from(unique.values()).slice(0, limit);
  }

  async getDepartures(stationId: string, country?: string, duration: number = 60): Promise<Departure[]> {
    if (country) {
      const adapter = this.getAdapterForCountry(country);
      if (adapter) {
        return adapter.getDepartures(stationId, duration);
      }
    }

    // Try primary adapter first
    return this.getPrimaryAdapter().getDepartures(stationId, duration);
  }

  async searchJourneys(from: string, to: string, country?: string, date?: string): Promise<Journey[]> {
    if (country) {
      const adapter = this.getAdapterForCountry(country);
      if (adapter) {
        return adapter.searchJourneys(from, to, date);
      }
    }

    // Try primary adapter first
    return this.getPrimaryAdapter().searchJourneys(from, to, date);
  }

  async getJourneyDetails(journeyId: string, country?: string): Promise<TrainJourney | null> {
    if (country) {
      const adapter = this.getAdapterForCountry(country);
      if (adapter) {
        return adapter.getJourneyDetails(journeyId);
      }
    }

    // Try primary adapter first
    return this.getPrimaryAdapter().getJourneyDetails(journeyId);
  }
}

export const trainDataService = new TrainDataService();
