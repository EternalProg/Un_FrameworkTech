

const Ajv = require('ajv');

const envSchema = {
  type: 'object',
  properties: {
    PORT: { type: 'string' },
    HOST: { type: 'string' },
    NODE_ENV: { type: 'string', enum: ['development', 'production', 'test'] }
  },
  required: ['PORT', 'HOST', 'NODE_ENV'],
  additionalProperties: true
};

const ajv = new Ajv();
const validate = ajv.compile(envSchema);

if (!validate(process.env)) {
  console.warn('Invalid or missing environment variables! Defaults will be used.');
  console.warn('Errors:', ajv.errorsText(validate.errors));
}

const parsedPort = Number.parseInt(process.env.PORT ?? '8080', 10);
const port = Number.isNaN(parsedPort) ? 8080 : parsedPort;

module.exports = {
  port,
  host: process.env.HOST || '0.0.0.0',
  env: process.env.NODE_ENV || 'production'
};
