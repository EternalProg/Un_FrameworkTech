import { getHealth } from '#controllers/health.controller';

async function registerHealthRoutes(fastify) {
  fastify.get('/health', getHealth);
}

export { registerHealthRoutes };
