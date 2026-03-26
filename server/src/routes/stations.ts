import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { trainDataService } from '../services/trainData';

interface SearchStationsQuery {
  q: string;
  country?: string;
  limit?: string;
}

interface GetDeparturesParams {
  id: string;
}

interface GetDeparturesQuery {
  duration?: string;
  country?: string;
}

export async function stationRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/stations/search?q={query}
  fastify.get('/search', {
    schema: {
      description: 'Search for stations by name',
      tags: ['stations'],
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', description: 'Search query' },
          country: { type: 'string', description: 'Country code (de, fr, gb)' },
          limit: { type: 'string', description: 'Maximum results (default: 10)' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            stations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  country: { type: 'string' },
                  coordinates: {
                    type: 'object',
                    properties: {
                      latitude: { type: 'number' },
                      longitude: { type: 'number' },
                    },
                  },
                  timezone: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Querystring: SearchStationsQuery }>, reply: FastifyReply) => {
    try {
      const { q, country, limit } = request.query;
      const limitNum = parseInt(limit || '10', 10);
      
      const stations = await trainDataService.searchStations(q, country, limitNum);
      
      return { stations };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: {
          code: 'SEARCH_ERROR',
          message: 'Failed to search stations',
        },
      });
    }
  });

  // GET /api/stations/{id}/departures
  fastify.get('/:id/departures', {
    schema: {
      description: 'Get departures for a station',
      tags: ['stations'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Station ID' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          duration: { type: 'string', description: 'Time window in minutes (default: 60)' },
          country: { type: 'string', description: 'Country code' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            departures: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tripId: { type: 'string' },
                  when: { type: 'string' },
                  plannedWhen: { type: 'string' },
                  delay: { type: 'number' },
                  platform: { type: 'string' },
                  direction: { type: 'string' },
                  line: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      productName: { type: 'string' },
                    },
                  },
                  cancelled: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: GetDeparturesParams; Querystring: GetDeparturesQuery }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { duration, country } = request.query;
      const durationNum = parseInt(duration || '60', 10);
      
      const departures = await trainDataService.getDepartures(id, country, durationNum);
      
      return { departures };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: {
          code: 'DEPARTURES_ERROR',
          message: 'Failed to get departures',
        },
      });
    }
  });
}
