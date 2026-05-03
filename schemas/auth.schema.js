const authBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      minLength: 5,
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
  additionalProperties: false,
};

const authUserSchema = {
  type: 'object',
  required: ['id', 'email'],
  properties: {
    id: {
      type: 'integer',
      minimum: 1,
    },
    email: {
      type: 'string',
      format: 'email',
    },
  },
  additionalProperties: false,
};

const registerRouteSchema = {
  tags: ['auth'],
  body: authBodySchema,
  response: {
    201: {
      type: 'object',
      required: ['user'],
      properties: {
        user: authUserSchema,
      },
      additionalProperties: false,
    },
  },
};

const loginRouteSchema = {
  tags: ['auth'],
  body: authBodySchema,
  response: {
    200: {
      type: 'object',
      required: ['user', 'accessToken'],
      properties: {
        user: authUserSchema,
        accessToken: {
          type: 'string',
          minLength: 1,
        },
      },
      additionalProperties: false,
    },
  },
};

const refreshRouteSchema = {
  tags: ['auth'],
  response: {
    200: {
      type: 'object',
      required: ['accessToken'],
      properties: {
        accessToken: {
          type: 'string',
          minLength: 1,
        },
      },
      additionalProperties: false,
    },
  },
};

const logoutRouteSchema = {
  tags: ['auth'],
  response: {
    204: {
      type: 'null',
    },
  },
};

export { loginRouteSchema, logoutRouteSchema, refreshRouteSchema, registerRouteSchema };
