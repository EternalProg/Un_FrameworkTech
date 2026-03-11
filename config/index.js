const fs = require('node:fs');
const path = require('node:path');
const envSchema = require('#validators/env.schema');
const { createValidator, formatAjvErrors } = require('#utils/validation');

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env.example');
  if (!fs.existsSync(envPath)) return;

  const file = fs.readFileSync(envPath, 'utf8');
  file.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

const env = {
  PORT: process.env.PORT,
  HOSTNAME: process.env.HOSTNAME,
  NODE_ENV: process.env.NODE_ENV,
};

const validateEnv = createValidator(envSchema);

if (!validateEnv(env)) {
  console.error('Invalid environment configuration:');
  formatAjvErrors(validateEnv.errors).forEach((message) => {
    console.error(`- ${message}`);
  });
  process.exit(1);
}

module.exports = {
  PORT: env.PORT,
  HOSTNAME: env.HOSTNAME,
  NODE_ENV: env.NODE_ENV,
};
