import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import mysql from 'mysql2/promise';
import envSchema from '../../schemas/env.schema.js';

const seedItems = [
  {
    device: 'Smart Lamp',
    status: 'on',
    room: 'Kitchen',
    description: 'Main kitchen lamp',
    image: null,
  },
  {
    device: 'Smart Thermostat',
    status: 'off',
    room: 'Living room',
    description: 'Controls the living room temperature',
    image: null,
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

  const pool = mysql.createPool({
    host: config.MYSQL_HOST,
    port: config.MYSQL_PORT,
    user: config.MYSQL_USER,
    password: config.MYSQL_PASSWORD,
    database: config.MYSQL_DB,
  });

  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM items');

    if (total > 0 && !isForceSeed) {
      console.log('Seed skipped: database is not empty.');
      return;
    }

    if (isForceSeed) {
      await pool.query('TRUNCATE TABLE items');
    }

    for (const item of seedItems) {
      await pool.query(
        'INSERT INTO items (device, status, room, description, image) VALUES (?, ?, ?, ?, ?)',
        [item.device, item.status, item.room, item.description, item.image],
      );
    }

    console.log(`Seed completed. Inserted ${seedItems.length} items.`);
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
