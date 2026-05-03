import {
  loginHandler,
  logoutHandler,
  refreshHandler,
  registerHandler,
} from '#controllers/auth.controller';
import {
  loginRouteSchema,
  logoutRouteSchema,
  refreshRouteSchema,
  registerRouteSchema,
} from '#schemas/auth.schema';

async function requireJwtAccessToken(request, reply) {
  await request.jwtVerify();

  if (request.user.type !== 'access') {
    return reply.unauthorized('Invalid access token');
  }
}

async function registerAuthRoutes(fastify) {
  fastify.post('/auth/register', { schema: registerRouteSchema }, registerHandler);
  fastify.post('/auth/login', { schema: loginRouteSchema }, loginHandler);
  fastify.post('/auth/refresh', { schema: refreshRouteSchema }, refreshHandler);
  fastify.post(
    '/auth/logout',
    {
      onRequest: [requireJwtAccessToken],
      schema: logoutRouteSchema,
    },
    logoutHandler,
  );
}

export { registerAuthRoutes };
