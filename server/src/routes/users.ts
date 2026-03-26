import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { userService } from '../services/user';

interface RegisterPushTokenBody {
  userId?: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/users/push-token
  fastify.post('/push-token', {
    schema: {
      description: 'Register a push notification token',
      tags: ['users'],
      body: {
        type: 'object',
        required: ['token', 'platform'],
        properties: {
          userId: { type: 'string', description: 'User ID (optional, creates new user if not provided)' },
          token: { type: 'string', description: 'Push token' },
          platform: { 
            type: 'string', 
            enum: ['ios', 'android', 'web'],
            description: 'Platform type' 
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            userId: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: RegisterPushTokenBody }>, reply: FastifyReply) => {
    try {
      const { userId, token, platform } = request.body;
      
      let actualUserId = userId;
      
      // Create new user if no userId provided
      if (!actualUserId) {
        const user = await userService.createUser();
        actualUserId = user.id;
      } else {
        // Verify user exists
        const user = await userService.getUser(actualUserId);
        if (!user) {
          return reply.status(404).send({
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found',
            },
          });
        }
      }
      
      // Register the push token
      await userService.registerPushToken(actualUserId, token, platform);
      
      return {
        success: true,
        userId: actualUserId,
        message: 'Push token registered successfully',
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: {
          code: 'REGISTRATION_ERROR',
          message: 'Failed to register push token',
        },
      });
    }
  });
}
