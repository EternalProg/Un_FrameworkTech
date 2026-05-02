import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import mongoose from 'mongoose';
import { ItemModel } from '../../db/models/item.model.js';
import { buildItemWithDefaults } from '../models/item.model.js';
import envSchema from '../../schemas/env.schema.js';

const seedItems = [
  {
    device: 'Smart Lamp',
    status: 'on',
    room: 'Kitchen',
    description: 'Main kitchen lamp',
  },
  {
    device: 'Smart Thermostat',
    status: 'off',
    room: 'Living room',
    description: 'Controls the living room temperature',
  },
];

const isForceSeed = process.argv.includes('--force');

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

async function seed() {
  const config = await loadConfig();

  await mongoose.connect(config.MONGO_URL, {
    dbName: config.MONGO_DB_NAME,
    serverSelectionTimeoutMS: 5000,
  });

  try {
    const hasData = (await ItemModel.estimatedDocumentCount()) > 0;

    if (hasData && !isForceSeed) {
      console.log('Seed skipped: database is not empty.');
      return;
    }

    if (isForceSeed) {
      await ItemModel.deleteMany({});
    }

    await ItemModel.insertMany(seedItems.map((item) => buildItemWithDefaults(item)));
    console.log(`Seed completed. Inserted ${seedItems.length} items.`);
  } finally {
    await mongoose.connection.close();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
