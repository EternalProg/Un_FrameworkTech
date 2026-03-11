import Ajv from 'ajv';

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
  console.warn('  Invalid or missing environment variables! Defaults will be used.');
  console.warn('   Errors:', ajv.errorsText(validate.errors));
}

const port = Number.parseInt(process.env.PORT ?? '8081', 10);

export default {
  port: Number.isNaN(port) ? 8081 : port,
  host: process.env.HOST ?? '0.0.0.0',
  env: process.env.NODE_ENV ?? 'production'
};
