/**
 * Railmate API Adapters
 *
 * This module provides adapters for various train data APIs:
 * - DeutscheBahnAdapter: German trains (v6.db.transport.rest)
 * - SNCFAdapter: French trains (api.sncf.com)
 * - NationalRailAdapter: UK trains (Darwin SOAP API)
 * - RailtimeAdapter: Multi-source real-time data (railtime.io)
 * - SBBAdapter: Swiss trains (transport.opendata.ch, no auth required)
 * - OEBBAdapter: Austrian trains (oebb.macistry.com/api, HAFAS-based)
 */

export { BaseTrainAdapter } from './base';
export { DeutscheBahnAdapter } from './deutschebahn';
export { SNCFAdapter } from './sncf';
export { NationalRailAdapter } from './nationalrail';
export { RailtimeAdapter, RailtimeSubscriptionRequest, RailtimeChangePayload } from './railtime';
export { SBBAdapter } from './sbb';
export { OEBBAdapter } from './oebb';

// Adapter factory for easy instantiation
import { BaseTrainAdapter } from './base';
import { DeutscheBahnAdapter } from './deutschebahn';
import { SNCFAdapter } from './sncf';
import { NationalRailAdapter } from './nationalrail';
import { RailtimeAdapter } from './railtime';
import { SBBAdapter } from './sbb';
import { OEBBAdapter } from './oebb';

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
  sbb?: {
    enabled: boolean;
  };
  oebb?: {
    enabled: boolean;
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

  if (config.sbb?.enabled !== false) {
    adapters.push(new SBBAdapter());
  }

  if (config.oebb?.enabled !== false) {
    adapters.push(new OEBBAdapter());
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
