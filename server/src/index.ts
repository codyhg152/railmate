import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { initDatabase, closeConnections } from './utils/database';
import { stationRoutes } from './routes/stations';
import { journeyRoutes } from './routes/journeys';
import { userRoutes } from './routes/users';
import { healthRoutes } from './routes/health';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      } : undefined,
    },
  });

  // Register CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // Register Swagger
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Railmate API',
        description: 'European train tracking API',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
        },
      ],
      tags: [
        { name: 'stations', description: 'Station-related endpoints' },
        { name: 'journeys', description: 'Journey planning endpoints' },
        { name: 'users', description: 'User management endpoints' },
        { name: 'health', description: 'Health check endpoints' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Register routes
  await fastify.register(stationRoutes, { prefix: '/api/stations' });
  await fastify.register(journeyRoutes, { prefix: '/api/journeys' });
  await fastify.register(userRoutes, { prefix: '/api/users' });
  await fastify.register(healthRoutes, { prefix: '/health' });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
      },
    });
  });

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
      },
    });
  });

  return fastify;
}

async function start() {
  try {
    // Initialize database
    await initDatabase();
    console.log('Database initialized');

    // Build and start server
    const server = await buildServer();
    
    await server.listen({ port: PORT, host: HOST });
    console.log(`Server listening on http://${HOST}:${PORT}`);
    console.log(`API Documentation available at http://${HOST}:${PORT}/documentation`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      await server.close();
      await closeConnections();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

start();
