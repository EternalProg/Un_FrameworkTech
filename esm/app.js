import fastify from 'fastify';
import errorHandler from './plugins/error-handler/index.js';
import apiRoutes from './routes/api.routes.js';

export default function buildApp() {
  const app = fastify({ logger: true });

  app.register(errorHandler);
  app.register(apiRoutes, { prefix: '/api' });

  return app;
}
