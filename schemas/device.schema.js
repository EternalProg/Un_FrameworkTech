const imageFieldSchema = {
  anyOf: [
    {
      type: 'string',
      minLength: 1,
    },
    {
      type: 'null',
    },
  ],
};

const deviceEntitySchema = {
  type: 'object',
  required: ['id', 'device', 'status', 'room', 'description', 'image'],
  properties: {
    id: {
      type: 'string',
      minLength: 24,
      maxLength: 24,
    },
    device: {
      type: 'string',
      minLength: 1,
    },
    status: {
      type: 'string',
      enum: ['on', 'off'],
    },
    room: {
      type: 'string',
      minLength: 1,
    },
    description: {
      type: 'string',
    },
    image: imageFieldSchema,
  },
  additionalProperties: false,
};

const externalDetailsSchema = {
  type: 'object',
  required: ['id', 'type', 'powerWatt'],
  properties: {
    id: {
      type: 'integer',
      nullable: true,
    },
    type: {
      type: 'string',
      nullable: true,
    },
    powerWatt: {
      type: 'number',
      nullable: true,
    },
  },
  additionalProperties: false,
};

const deviceDetailsSchema = {
  ...deviceEntitySchema,
  required: [...deviceEntitySchema.required, 'external'],
  properties: {
    ...deviceEntitySchema.properties,
    external: externalDetailsSchema,
  },
};

const deviceQuerySchema = {
  type: 'object',
  properties: {
    room: {
      type: 'string',
      minLength: 1,
    },
  },
  additionalProperties: false,
};

const v2ItemsQuerySchema = {
  type: 'object',
  properties: {
    page: {
      type: 'integer',
      minimum: 1,
      default: 1,
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 10,
    },
    room: {
      type: 'string',
      minLength: 1,
    },
  },
  additionalProperties: false,
};

const deviceCreateBodySchema = {
  type: 'object',
  required: ['device', 'room'],
  properties: {
    device: {
      type: 'string',
      minLength: 1,
    },
    room: {
      type: 'string',
      minLength: 1,
    },
    status: {
      type: 'string',
      enum: ['on', 'off'],
    },
    description: {
      type: 'string',
    },
    image: imageFieldSchema,
  },
  additionalProperties: false,
};

const deviceUpdateBodySchema = {
  type: 'object',
  minProperties: 1,
  properties: {
    device: {
      type: 'string',
      minLength: 1,
    },
    room: {
      type: 'string',
      minLength: 1,
    },
    status: {
      type: 'string',
      enum: ['on', 'off'],
    },
    description: {
      type: 'string',
    },
    image: imageFieldSchema,
  },
  additionalProperties: false,
};

const deviceParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      minLength: 24,
      maxLength: 24,
    },
  },
  additionalProperties: false,
};

const importReportSchema = {
  type: 'object',
  required: ['importedCount', 'rejectedCount', 'rejected'],
  properties: {
    importedCount: { type: 'integer', minimum: 0 },
    rejectedCount: { type: 'integer', minimum: 0 },
    rejected: {
      type: 'array',
      items: {
        type: 'object',
        required: ['row', 'reason'],
        properties: {
          row: { type: 'integer', minimum: 1 },
          reason: { type: 'string', minLength: 1 },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};

const exportItemsQuerySchema = {
  type: 'object',
  properties: {
    room: {
      type: 'string',
      minLength: 1,
    },
    transform: {
      type: 'boolean',
      default: false,
    },
  },
  additionalProperties: false,
};

const listDevicesRouteSchema = {
  querystring: deviceQuerySchema,
  response: {
    200: {
      type: 'object',
      required: ['count', 'items'],
      properties: {
        count: {
          type: 'integer',
          minimum: 0,
        },
        items: {
          type: 'array',
          items: deviceEntitySchema,
        },
      },
      additionalProperties: false,
    },
  },
};

const listDevicesV2RouteSchema = {
  querystring: v2ItemsQuerySchema,
  response: {
    200: {
      type: 'object',
      required: ['items', 'total', 'page', 'limit', 'totalPages'],
      properties: {
        items: {
          type: 'array',
          items: deviceEntitySchema,
        },
        total: { type: 'integer', minimum: 0 },
        page: { type: 'integer', minimum: 1 },
        limit: { type: 'integer', minimum: 1 },
        totalPages: { type: 'integer', minimum: 1 },
      },
      additionalProperties: false,
    },
  },
};

const createDeviceRouteSchema = {
  body: deviceCreateBodySchema,
  response: {
    201: {
      type: 'object',
      required: ['message', 'device'],
      properties: {
        message: {
          type: 'string',
        },
        device: deviceEntitySchema,
      },
      additionalProperties: false,
    },
  },
};

const updateDeviceRouteSchema = {
  params: deviceParamsSchema,
  body: deviceUpdateBodySchema,
  response: {
    200: {
      type: 'object',
      required: ['message', 'device'],
      properties: {
        message: {
          type: 'string',
        },
        device: deviceEntitySchema,
      },
      additionalProperties: false,
    },
  },
};

const deleteDeviceRouteSchema = {
  params: deviceParamsSchema,
  response: {
    200: {
      type: 'object',
      required: ['message'],
      properties: {
        message: {
          type: 'string',
        },
      },
      additionalProperties: false,
    },
  },
};

const importItemsRouteSchema = {
  response: {
    200: importReportSchema,
  },
};

const exportItemsRouteSchema = {
  querystring: exportItemsQuerySchema,
  response: {
    200: {
      type: 'string',
    },
  },
};

const streamItemsRouteSchema = {
  querystring: deviceQuerySchema,
  response: {
    200: {
      type: 'string',
    },
  },
};

const backupParamsSchema = {
  type: 'object',
  required: ['timestamp'],
  properties: {
    timestamp: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z$',
    },
  },
  additionalProperties: false,
};

const getBackupRouteSchema = {
  params: backupParamsSchema,
  response: {
    200: {
      type: 'string',
    },
  },
};

const uploadItemImageRouteSchema = {
  params: deviceParamsSchema,
  response: {
    200: {
      type: 'object',
      required: ['message', 'device'],
      properties: {
        message: { type: 'string' },
        device: deviceEntitySchema,
      },
      additionalProperties: false,
    },
  },
};

const itemDetailsRouteSchema = {
  params: deviceParamsSchema,
  response: {
    200: deviceDetailsSchema,
  },
};

export {
  listDevicesRouteSchema,
  listDevicesV2RouteSchema,
  createDeviceRouteSchema,
  updateDeviceRouteSchema,
  deleteDeviceRouteSchema,
  exportItemsRouteSchema,
  streamItemsRouteSchema,
  getBackupRouteSchema,
  importItemsRouteSchema,
  uploadItemImageRouteSchema,
  itemDetailsRouteSchema,
};
