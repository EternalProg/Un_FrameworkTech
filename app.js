import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import fastifySensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import { ERROR_MESSAGES } from '#constants/error-messages';
import { errorHandler } from '#controllers/error.controller';
import { registerDeviceRoutes } from '#routes/device.routes';
import { registerErrorRoutes } from '#routes/error.routes';
import { registerHealthRoutes } from '#routes/health.routes';
import envSchema from '#schemas/env.schema';
import { isModelHashChanged } from './src/migrations/check-model-version.js';
import { createDataBackup } from './src/utils/backup.utils.js';
import { uploadsDirectoryPath } from './src/utils/path.utils.js';

function buildLoggerOptions(nodeEnv) {
  if (nodeEnv === 'production') {
    return { level: 'warn' };
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

function resolveCorsOrigin(config) {
  if (config.NODE_ENV === 'development') {
    return '*';
  }

  return config.CORS_ORIGIN;
}

const SHUTDOWN_TIMEOUT_MS = 10000;
const CORS_METHODS = ['GET', 'POST', 'PATCH', 'DELETE'];
const config = await loadConfig();

const fastify = Fastify({
  logger: buildLoggerOptions(config.NODE_ENV),
});

fastify.decorate('config', config);

await fastify.register(fastifySensible);
await fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});
await fastify.register(fastifyCors, {
  origin: resolveCorsOrigin(config),
  methods: CORS_METHODS,
});
await fastify.register(fastifyHelmet, { global: true });
await fastify.register(fastifyStatic, {
  root: uploadsDirectoryPath,
  prefix: '/uploads/',
});

fastify.addHook('onClose', async (instance) => {
  instance.log.info('Fastify server has been closed');
});

fastify.setNotFoundHandler((request, reply) => {
  request.log.warn(
    {
      method: request.method,
      url: request.url,
    },
    ERROR_MESSAGES.ROUTE_NOT_FOUND,
  );

  reply.code(404).send({
    statusCode: 404,
    error: 'Not Found',
    message: ERROR_MESSAGES.ROUTE_NOT_FOUND,
  });
});

fastify.setErrorHandler(errorHandler);

await fastify.register(registerHealthRoutes);
await fastify.register(registerErrorRoutes);
await fastify.register(registerDeviceRoutes);

await createDataBackup();

if (await isModelHashChanged()) {
  fastify.log.warn('Data schema changed. Run "npm run migrate" to update existing files.');
}

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
