import { readFileSync } from 'node:fs';

function loadDotEnv(filePath) {
  const fileContent = readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n');
  const env = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const delimiterIndex = trimmed.indexOf('=');

    if (delimiterIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, delimiterIndex).trim();
    const value = trimmed.slice(delimiterIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

const env = loadDotEnv('.env');

export default {
  out: './drizzle',
  schema: './db/schema.js',
  dialect: 'mysql',
  dbCredentials: {
    host: env.MYSQL_HOST,
    port: Number(env.MYSQL_PORT ?? 3306),
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DB,
  },
};
