
const fastify  = require('fastify');
const apiRoutes = require('./routes/api.routes.js');

function buildApp() {
  const app = fastify({ logger: true });

  const errorHandler = require('./plugins/error-handler');
  app.register(errorHandler);

  app.register(apiRoutes, { prefix: '/api' });

  return app;
}

module.exports = buildApp;
