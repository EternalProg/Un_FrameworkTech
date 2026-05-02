import fp from 'fastify-plugin';
import fastifyRedis from '@fastify/redis';

async function redisPlugin(fastify) {
  await fastify.register(fastifyRedis, {
    host: fastify.config.REDIS_HOST,
    port: fastify.config.REDIS_PORT,
  });
}

export default fp(redisPlugin, { name: 'redis' });
