import fp from 'fastify-plugin';
import mongoose from 'mongoose';

async function mongoPlugin(fastify) {
  try {
    await mongoose.connect(fastify.config.MONGO_URL, {
      dbName: fastify.config.MONGO_DB_NAME,
    });

    fastify.decorate('db', mongoose.connection);

    fastify.addHook('onClose', async () => {
      await mongoose.connection.close();
    });
  } catch (error) {
    fastify.log.error({ err: error }, 'MongoDB connection failed');
    process.exit(1);
  }
}

export default fp(mongoPlugin, { name: 'mongo' });
