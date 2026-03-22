const envSchema = {
  type: 'object',
  required: ['PORT', 'HOSTNAME', 'NODE_ENV', 'ADMIN_API_KEY'],
  properties: {
    PORT: {
      type: 'integer',
      minimum: 1,
      maximum: 65535,
      default: 3000,
    },
    HOSTNAME: {
      type: 'string',
      minLength: 1,
      default: '127.0.0.1',
    },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production'],
      default: 'development',
    },
    ADMIN_API_KEY: {
      type: 'string',
      minLength: 8,
      default: 'change-me-please',
    },
  },
};

export default envSchema;
