/**
 * Railmate API Adapters
 * 
 * This module provides adapters for various train data APIs:
 * - DeutscheBahnAdapter: German trains (v6.db.transport.rest)
 * - SNCFAdapter: French trains (api.sncf.com)
 * - NationalRailAdapter: UK trains (Darwin SOAP API)
 * - RailtimeAdapter: Multi-source real-time data (railtime.io)
 */

export { BaseTrainAdapter } from './base';
export { DeutscheBahnAdapter } from './deutschebahn';
export { SNCFAdapter } from './sncf';
export { NationalRailAdapter } from './nationalrail';
export { RailtimeAdapter, RailtimeSubscriptionRequest, RailtimeChangePayload } from './railtime';

// Adapter factory for easy instantiation
import { BaseTrainAdapter } from './base';
import { DeutscheBahnAdapter } from './deutschebahn';
import { SNCFAdapter } from './sncf';
import { NationalRailAdapter } from './nationalrail';
import { RailtimeAdapter } from './railtime';

export interface AdapterConfig {
  deutscheBahn?: {
    enabled: boolean;
  };
  sncf?: {
    enabled: boolean;
    apiToken: string;
  };
  nationalRail?: {
    enabled: boolean;
    apiToken: string;
  };
  railtime?: {
    enabled: boolean;
    apiSecret: string;
  };
}

/**
 * Create all configured adapters
 */
export function createAdapters(config: AdapterConfig): BaseTrainAdapter[] {
  const adapters: BaseTrainAdapter[] = [];

  if (config.deutscheBahn?.enabled !== false) {
    adapters.push(new DeutscheBahnAdapter());
  }

  if (config.sncf?.enabled && config.sncf.apiToken) {
    adapters.push(new SNCFAdapter(config.sncf.apiToken));
  }

  if (config.nationalRail?.enabled && config.nationalRail.apiToken) {
    adapters.push(new NationalRailAdapter(config.nationalRail.apiToken));
  }

  if (config.railtime?.enabled && config.railtime.apiSecret) {
    adapters.push(new RailtimeAdapter(config.railtime.apiSecret));
  }

  return adapters;
}

/**
 * Health check all adapters
 */
export async function healthCheckAll(adapters: BaseTrainAdapter[]): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  
  for (const adapter of adapters) {
    try {
      results[adapter.name] = await adapter.healthCheck();
    } catch (error) {
      results[adapter.name] = false;
    }
  }
  
  return results;
}
