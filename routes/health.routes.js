import { ERROR_MESSAGES } from '#constants/error-messages';
import { getHealth, getHealthDetails } from '#controllers/health.controller';
import { getHealthDetailsRouteSchema, getHealthRouteSchema } from '#schemas/health.schema';

async function requireAdminApiKey(request, reply) {
  const apiKeyHeader = request.headers['x-api-key'];
  const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;

  if (apiKey !== request.server.config.ADMIN_API_KEY) {
    return reply.unauthorized(ERROR_MESSAGES.UNAUTHORIZED);
  }
}

async function registerHealthRoutes(fastify) {
  fastify.get('/health', { schema: getHealthRouteSchema }, getHealth);

  fastify.get(
    '/health/details',
    {
      onRequest: [requireAdminApiKey],
      schema: getHealthDetailsRouteSchema,
    },
    getHealthDetails,
  );
}

export { registerHealthRoutes };
