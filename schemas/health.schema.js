const memoryUsageSchema = {
  type: 'object',
  required: ['rss', 'heapTotal', 'heapUsed', 'external', 'arrayBuffers'],
  properties: {
    rss: { type: 'number' },
    heapTotal: { type: 'number' },
    heapUsed: { type: 'number' },
    external: { type: 'number' },
    arrayBuffers: { type: 'number' },
  },
  additionalProperties: false,
};

const getHealthRouteSchema = {
  response: {
    200: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          const: 'ok',
        },
      },
      additionalProperties: false,
    },
  },
};

const getHealthDetailsRouteSchema = {
  response: {
    200: {
      type: 'object',
      required: ['status', 'pid', 'nodeVersion', 'platform', 'uptime', 'memoryUsage'],
      properties: {
        status: {
          type: 'string',
          const: 'ok',
        },
        pid: { type: 'integer' },
        nodeVersion: { type: 'string' },
        platform: { type: 'string' },
        uptime: { type: 'number' },
        memoryUsage: memoryUsageSchema,
      },
      additionalProperties: false,
    },
  },
};

export { getHealthRouteSchema, getHealthDetailsRouteSchema };
