const envSchema = {
  type: 'object',
  required: ['PORT', 'HOSTNAME', 'NODE_ENV', 'ADMIN_API_KEY', 'CORS_ORIGIN'],
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
    CORS_ORIGIN: {
      type: 'string',
      minLength: 1,
      default: 'https://app.example.com',
    },
    EXTERNAL_API_URL: {
      type: 'string',
      minLength: 1,
      default: 'http://127.0.0.1:3001/deviceTypes',
    },
    GITHUB_TOKEN: {
      type: 'string',
      default: '',
    },
    GITHUB_ANALYTICS_MAX_CONTRIBUTORS: {
      type: 'integer',
      default: 0,
    },
    GITHUB_ANALYTICS_MAX_EVENTS: {
      type: 'integer',
      default: 0,
    },
    GITHUB_ANALYTICS_MAX_CANDIDATES: {
      type: 'integer',
      default: 0,
    },
  },
};

export default envSchema;
