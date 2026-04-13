import { getError } from '#controllers/error.controller';

const errorRouteSchema = {
  response: {
    500: {
      type: 'object',
      required: ['statusCode', 'error', 'message'],
      properties: {
        statusCode: { type: 'integer' },
        error: { type: 'string' },
        message: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};

async function registerErrorRoutes(fastify) {
  fastify.get('/error', { schema: errorRouteSchema }, getError);
}

export { registerErrorRoutes };
