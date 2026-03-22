import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import { registerDeviceRoutes } from '#routes/device.routes';
import { registerErrorRoutes } from '#routes/error.routes';
import { registerHealthRoutes } from '#routes/health.routes';
import envSchema from '#schemas/env.schema';

async function loadConfig() {
  const bootstrap = Fastify({ logger: false });

  await bootstrap.register(fastifyEnv, {
    confKey: 'config',
    schema: envSchema,
    dotenv: true,
  });

  await bootstrap.ready();

  const config = { ...bootstrap.config };

  await bootstrap.close();
  return config;
}

const SHUTDOWN_TIMEOUT_MS = 10000;
const config = await loadConfig();

const fastify = Fastify();

fastify.decorate('config', config);

fastify.addHook('onClose', async () => {
  console.log('Fastify server has been closed');
});

fastify.setNotFoundHandler((_request, reply) => {
  reply.code(404).send({ error: 'Route not found' });
});

await fastify.register(registerHealthRoutes);
await fastify.register(registerErrorRoutes);
await fastify.register(registerDeviceRoutes);

try {
  await fastify.listen({
    port: fastify.config.PORT,
    host: fastify.config.HOSTNAME,
  });

  console.log(`Server running at http://${fastify.config.HOSTNAME}:${fastify.config.PORT}`);
} catch (error) {
  console.error('Unable to start server:', error);
  process.exit(1);
}

let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`Received ${signal}. Shutting down...`);

  const shutdownTimer = setTimeout(() => {
    console.error('Shutdown timeout exceeded. Forcing exit.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  fastify
    .close()
    .then(() => {
      clearTimeout(shutdownTimer);
      process.exit(0);
    })
    .catch((error) => {
      clearTimeout(shutdownTimer);
      console.error('Error during server shutdown:', error);
      process.exit(1);
    });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  gracefulShutdown('unhandledRejection');
});
