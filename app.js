import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import { registerDeviceRoutes } from '#routes/device.routes';
import { registerErrorRoutes } from '#routes/error.routes';
import { registerHealthRoutes } from '#routes/health.routes';
import envSchema from '#schemas/env.schema';

function buildLoggerOptions(nodeEnv) {
  if (nodeEnv === 'production') {
    return { level: 'error' };
  }

  return {
    level: 'info',
    transport: {
      target: 'pino-pretty',
    },
  };
}

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

const fastify = Fastify({
  logger: buildLoggerOptions(config.NODE_ENV),
});

fastify.decorate('config', config);

fastify.addHook('onClose', async (instance) => {
  instance.log.info('Fastify server has been closed');
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

  fastify.log.info(`Server running at http://${fastify.config.HOSTNAME}:${fastify.config.PORT}`);
} catch (error) {
  fastify.log.error({ err: error }, 'Unable to start server');
  process.exit(1);
}

let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  fastify.log.info({ signal }, 'Shutdown signal received');

  const shutdownTimer = setTimeout(() => {
    fastify.log.error('Shutdown timeout exceeded. Forcing exit.');
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
      fastify.log.error({ err: error }, 'Error during server shutdown');
      process.exit(1);
    });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (error) => {
  fastify.log.error({ err: error }, 'Uncaught exception');
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  fastify.log.error({ reason }, 'Unhandled rejection');
  gracefulShutdown('unhandledRejection');
});
