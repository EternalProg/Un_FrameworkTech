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

const deviceCreateSchema = {
  type: 'object',
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
  required: ['device', 'room'],
  additionalProperties: false,
};

const deviceUpdateSchema = {
  type: 'object',
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
  minProperties: 1,
  additionalProperties: false,
};

const deviceParamsSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      minimum: 1,
    },
  },
  required: ['id'],
  additionalProperties: false,
};

module.exports = {
  deviceQuerySchema,
  deviceCreateSchema,
  deviceUpdateSchema,
  deviceParamsSchema,
};
