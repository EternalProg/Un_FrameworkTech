const deviceEntitySchema = {
  type: 'object',
  required: ['id', 'device', 'status', 'room'],
  properties: {
    id: {
      type: 'integer',
      minimum: 1,
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
  },
  additionalProperties: false,
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
  },
  additionalProperties: false,
};

const deviceParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'integer',
      minimum: 1,
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

export {
  listDevicesRouteSchema,
  createDeviceRouteSchema,
  updateDeviceRouteSchema,
  deleteDeviceRouteSchema,
};
