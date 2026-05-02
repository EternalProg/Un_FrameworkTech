import fp from 'fastify-plugin';
import { drizzle } from 'drizzle-orm/mysql2';

async function drizzlePlugin(fastify) {
  const db = drizzle(fastify.mysql);
  fastify.decorate('drizzle', db);
  fastify.decorate('db', db);
}

export default fp(drizzlePlugin, { name: 'drizzle', dependencies: ['mysql'] });
