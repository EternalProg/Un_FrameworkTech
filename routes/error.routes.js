import { getError } from '#controllers/error.controller';

async function registerErrorRoutes(fastify) {
  fastify.get('/error', getError);
}

export { registerErrorRoutes };
