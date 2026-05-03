import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';
import fastifySensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyWebsocket from '@fastify/websocket';
import { ERROR_MESSAGES } from '#constants/error-messages';
import { buildJwtBlacklistKey } from '#constants/redis-keys';
import { errorHandler } from '#controllers/error.controller';
import { registerAuthRoutes } from '#routes/auth.routes';
import { registerDeviceRoutes } from '#routes/device.routes';
import { registerErrorRoutes } from '#routes/error.routes';
import { registerGitHubV1Routes } from '#routes/github.routes';
import { registerHealthRoutes } from '#routes/health.routes';
import { registerV2Routes } from '#routes/v2.routes';
import { createDeviceRepository } from '#repositories/device.repository';
import { createUserRepository } from '#repositories/user.repository';
import envSchema from '#schemas/env.schema';
import { setAuthServiceDependencies } from '#services/auth.service';
import { setDeviceRepository, setDeviceServiceDependencies } from '#services/device.service';
import { setItemDetailsDependencies } from '#services/item-details.service';
import drizzlePlugin from '../../db/drizzle.js';
import mysqlPlugin from '../../db/mysql.js';
import redisPlugin from '../../db/redis.js';
import { createDataBackup } from '../utils/backup.utils.js';
import { uploadsDirectoryPath } from '../utils/path.utils.js';

const CORS_METHODS = ['GET', 'POST', 'PATCH', 'DELETE'];

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

async function loadConfig({ dotenvPath } = {}) {
  const bootstrap = Fastify({ logger: false });

  await bootstrap.register(fastifyEnv, {
    confKey: 'config',
    schema: envSchema,
    dotenv: dotenvPath ? { path: dotenvPath } : true,
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

async function buildApp({ dotenvPath, skipBackup = false } = {}) {
  const config = await loadConfig({ dotenvPath });

  const fastify = Fastify({
    logger: buildLoggerOptions(config.NODE_ENV),
  });

  fastify.decorate('config', config);

  await fastify.register(fastifySensible);
  await fastify.register(redisPlugin);
  await fastify.register(fastifyCookie);
  await fastify.register(fastifyJwt, {
    secret: fastify.config.JWT_SECRET,
    trusted: async (_request, decodedToken) => {
      const jti = decodedToken.jti;

      if (!jti) {
        return false;
      }

      const isBlacklisted = await fastify.redis.get(buildJwtBlacklistKey(jti));
      return !isBlacklisted;
    },
  });

  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Lab API',
        description: 'Fastify lab API documentation',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Authorization header format: Bearer <token>',
          },
        },
      },
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  await fastify.register(fastifyRateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    redis: fastify.redis,
  });

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
  await fastify.register(fastifyWebsocket);
  await fastify.register(mysqlPlugin);
  await fastify.register(drizzlePlugin);

  setDeviceRepository(createDeviceRepository(fastify.db));
  setAuthServiceDependencies({ users: createUserRepository(fastify.db), redis: fastify.redis });
  setDeviceServiceDependencies({ redis: fastify.redis });
  setItemDetailsDependencies({ redis: fastify.redis });

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

  await fastify.register(registerHealthRoutes, { prefix: '/api/v1' });
  await fastify.register(registerErrorRoutes, { prefix: '/api/v1' });
  await fastify.register(registerAuthRoutes, { prefix: '/api/v1' });
  await fastify.register(registerDeviceRoutes, { prefix: '/api/v1' });
  await fastify.register(registerGitHubV1Routes, { prefix: '/api/v1' });
  await fastify.register(registerV2Routes, { prefix: '/api/v2' });

  if (!skipBackup) {
    await createDataBackup();
  }

  return fastify;
}

export { buildApp, buildLoggerOptions, loadConfig };
