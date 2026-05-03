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
  summary: 'Register user',
  description:
    'Validates payload, checks unique email, hashes password with argon2, and stores user.',
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
  summary: 'Login user',
  description:
    'Validates credentials, returns access token in response body and refresh token in httpOnly cookie.',
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
  summary: 'Refresh access token',
  description: 'Reads refresh token from httpOnly cookie and returns a new access token.',
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
  summary: 'Logout user',
  description:
    'Requires Authorization header in format Bearer <token>, blacklists access token, and clears refresh token.',
  security: [{ bearerAuth: [] }],
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: {
        type: 'string',
        minLength: 8,
        pattern: '^Bearer\\s.+$',
      },
    },
    additionalProperties: true,
  },
  response: {
    204: {
      type: 'null',
    },
  },
};

export { loginRouteSchema, logoutRouteSchema, refreshRouteSchema, registerRouteSchema };
