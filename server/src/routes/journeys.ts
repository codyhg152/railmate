import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { trainDataService } from '../services/trainData';

interface SearchJourneysQuery {
  from: string;
  to: string;
  date?: string;
  country?: string;
}

interface GetJourneyParams {
  id: string;
}

interface GetJourneyQuery {
  country?: string;
}

export async function journeyRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/journeys/search?from={id}&to={id}&date={iso}
  fastify.get('/search', {
    schema: {
      description: 'Search for journeys between two stations',
      tags: ['journeys'],
      querystring: {
        type: 'object',
        required: ['from', 'to'],
        properties: {
          from: { type: 'string', description: 'Origin station ID' },
          to: { type: 'string', description: 'Destination station ID' },
          date: { type: 'string', description: 'Departure date (ISO 8601)' },
          country: { type: 'string', description: 'Country code' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            journeys: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  legs: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        origin: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            departure: { type: 'string' },
                          },
                        },
                        destination: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            arrival: { type: 'string' },
                          },
                        },
                        line: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                  price: {
                    type: 'object',
                    properties: {
                      amount: { type: 'number' },
                      currency: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Querystring: SearchJourneysQuery }>, reply: FastifyReply) => {
    try {
      const { from, to, date, country } = request.query;
      
      if (!from || !to) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Both from and to parameters are required',
          },
        });
      }
      
      const journeys = await trainDataService.searchJourneys(from, to, country, date);
      
      if (journeys.length === 0) {
        return reply.status(404).send({
          error: {
            code: 'NO_JOURNEYS_FOUND',
            message: 'No journeys found between the specified stations',
          },
        });
      }
      
      return { journeys };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: {
          code: 'JOURNEY_SEARCH_ERROR',
          message: 'Failed to search journeys',
        },
      });
    }
  });

  // GET /api/journeys/{id}
  fastify.get('/:id', {
    schema: {
      description: 'Get journey details',
      tags: ['journeys'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Journey ID' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country code' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            journey: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                operator: { type: 'string' },
                trainNumber: { type: 'string' },
                trainType: { type: 'string' },
                origin: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                  },
                },
                destination: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                  },
                },
                scheduledDeparture: { type: 'string' },
                actualDeparture: { type: 'string' },
                departureDelay: { type: 'number' },
                scheduledArrival: { type: 'string' },
                actualArrival: { type: 'string' },
                arrivalDelay: { type: 'number' },
                status: { type: 'string' },
                stops: { type: 'array' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: GetJourneyParams; Querystring: GetJourneyQuery }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { country } = request.query;
      
      const journey = await trainDataService.getJourneyDetails(id, country);
      
      if (!journey) {
        return reply.status(404).send({
          error: {
            code: 'JOURNEY_NOT_FOUND',
            message: 'Journey not found',
          },
        });
      }
      
      return { journey };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: {
          code: 'JOURNEY_DETAILS_ERROR',
          message: 'Failed to get journey details',
        },
      });
    }
  });
}
