import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import envSchema from '../../schemas/env.schema.js';
import {
  getCurrentSchemaHash,
  getStoredSchemaHash,
  updateStoredSchemaHash,
} from './schema-version.utils.js';

const schemaFilePath = path.join(process.cwd(), 'db', 'schema.sql');

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

async function migrate() {
  const config = await loadConfig();
  const schemaSql = await readFile(schemaFilePath, 'utf-8');

  const pool = mysql.createPool({
    host: config.MYSQL_HOST,
    port: config.MYSQL_PORT,
    user: config.MYSQL_USER,
    password: config.MYSQL_PASSWORD,
    database: config.MYSQL_DB,
    multipleStatements: true,
  });

  try {
    await pool.query(schemaSql);

    const currentHash = await getCurrentSchemaHash();
    const storedHash = await getStoredSchemaHash(pool);

    if (storedHash === currentHash) {
      console.log('Migration not required. Schema hash is unchanged.');
      return;
    }

    await updateStoredSchemaHash(pool, currentHash);
    console.log('Migration completed. Schema hash synchronized in migrations table.');
  } finally {
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
