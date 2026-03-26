import { FastifyInstance, FastifyReply } from 'fastify';
import { redis } from '../utils/database';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /health
  fastify.get('/', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            version: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                database: { type: 'string' },
                cache: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (_request, reply: FastifyReply) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'unknown',
        cache: 'unknown',
      },
    };

    // Check Redis
    try {
      await redis.ping();
      health.services.cache = 'ok';
    } catch (error) {
      health.services.cache = 'error';
      health.status = 'degraded';
    }

    // Check PostgreSQL
    try {
      const { pgPool } = await import('../utils/database');
      await pgPool.query('SELECT 1');
      health.services.database = 'ok';
    } catch (error) {
      health.services.database = 'error';
      health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    return reply.status(statusCode).send(health);
  });
}
