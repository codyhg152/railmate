import Fastify from 'fastify';
import cors from '@fastify/cors';
import { 
  DeutscheBahnAdapter,
  SBBAdapter, 
  OEBBAdapter 
} from './adapters';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Initialize adapters
const adapters: Record<string, any> = {
  deutschebahn: new DeutscheBahnAdapter(),
  sbb: new SBBAdapter(),
  oebb: new OEBBAdapter(),
};

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

async function buildServer() {
  const fastify = Fastify({
    logger: true,
  });

  // Register CORS
  await fastify.register(cors, {
    origin: '*',
  });

  // Health check
  fastify.get('/health', async () => {
    const adapterHealth: Record<string, boolean> = {};
    for (const [name, adapter] of Object.entries(adapters)) {
      try {
        adapterHealth[name] = await adapter.healthCheck();
      } catch {
        adapterHealth[name] = false;
      }
    }
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      adapters: adapterHealth
    };
  });

  // Get all available rail networks
  fastify.get('/api/networks', async () => {
    return [
      { id: 'deutschebahn', name: 'Deutsche Bahn', country: 'DE', flag: '🇩🇪' },
      { id: 'sbb', name: 'SBB/CFF/FFS', country: 'CH', flag: '🇨🇭' },
      { id: 'oebb', name: 'ÖBB', country: 'AT', flag: '🇦🇹' },
    ];
  });

  // Search stations across all networks
  fastify.get('/api/stations/search', async (request, reply) => {
    const { query, network } = request.query as { query: string; network?: string };
    if (!query || query.length < 2) {
      return reply.code(400).send({ error: 'Query must be at least 2 characters' });
    }

    const cacheKey = `stations:${network || 'all'}:${query}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      let results: any[] = [];

      if (network && adapters[network]) {
        // Search specific network
        const adapter = adapters[network];
        const stations = await adapter.searchStations(query, 10);
        results = stations.map((s: any) => ({ ...s, network }));
      } else {
        // Search all networks in parallel
        const searchPromises = Object.entries(adapters).map(async ([name, adapter]) => {
          try {
            const stations = await adapter.searchStations(query, 5);
            return stations.map((s: any) => ({ ...s, network: name }));
          } catch (error: any) {
            fastify.log.warn(`Failed to search ${name}: ${error.message}`);
            return [];
          }
        });

        const allResults = await Promise.all(searchPromises);
        results = allResults.flat();
      }

      const response = { stations: results, total: results.length };
      cache.set(cacheKey, { data: response, timestamp: Date.now() });
      return response;
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to search stations' });
    }
  });

  // Get departures for a station
  fastify.get('/api/stations/:network/:id/departures', async (request, reply) => {
    const { network, id } = request.params as { network: string; id: string };
    
    const adapter = adapters[network];
    if (!adapter) {
      return reply.code(400).send({ error: 'Unknown network' });
    }

    const cacheKey = `departures:${network}:${id}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      const departures = await adapter.getDepartures(id, 20);
      const response = { departures, network };
      cache.set(cacheKey, { data: response, timestamp: Date.now() });
      return response;
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to get departures' });
    }
  });

  // Search journeys
  fastify.get('/api/journeys/search', async (request, reply) => {
    const { 
      from, 
      to, 
      date, 
      network 
    } = request.query as { 
      from: string; 
      to: string; 
      date?: string;
      network?: string;
    };
    
    if (!from || !to) {
      return reply.code(400).send({ error: 'From and to stations are required' });
    }

    const cacheKey = `journeys:${network || 'all'}:${from}:${to}:${date || 'now'}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      const searchDate = date ? new Date(date) : new Date();
      
      let results: any[] = [];

      if (network && adapters[network]) {
        const adapter = adapters[network];
        const journeys = await adapter.searchJourneys(from, to, searchDate.toISOString());
        results = journeys.map((j: any) => ({ ...j, network }));
      } else {
        // Search all networks
        const searchPromises = Object.entries(adapters).map(async ([name, adapter]) => {
          try {
            const journeys = await adapter.searchJourneys(from, to, searchDate.toISOString());
            return journeys.map((j: any) => ({ ...j, network: name }));
          } catch (error: any) {
            fastify.log.warn(`Failed to search ${name}: ${error.message}`);
            return [];
          }
        });

        const allResults = await Promise.all(searchPromises);
        results = allResults.flat();
      }

      // Sort by departure time
      results.sort((a, b) => {
        const timeA = new Date(a.scheduledDeparture || a.departure).getTime();
        const timeB = new Date(b.scheduledDeparture || b.departure).getTime();
        return timeA - timeB;
      });

      const response = { 
        journeys: results.slice(0, 10), 
        total: results.length,
        from,
        to,
        date: searchDate.toISOString()
      };
      
      cache.set(cacheKey, { data: response, timestamp: Date.now() });
      return response;
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to search journeys' });
    }
  });

  return fastify;
}

async function start() {
  const server = await buildServer();
  
  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`🚂 Railmate API server running on http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
    console.log(`🌍 Networks: http://${HOST}:${PORT}/api/networks`);
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }
}

start();
