const githubQuerySchema = {
  type: 'object',
  required: ['repo'],
  properties: {
    repo: {
      type: 'string',
      pattern: '^[^/]+/[^/]+$',
    },
  },
  additionalProperties: false,
};

const sharedRepoEntrySchema = {
  type: 'object',
  required: ['repo', 'sharedContributorsCount', 'sharedContributors'],
  properties: {
    repo: { type: 'string' },
    sharedContributorsCount: { type: 'integer', minimum: 0 },
    sharedContributors: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  additionalProperties: false,
};

const sharedReposResponseSchema = {
  type: 'object',
  required: ['sourceRepo', 'results'],
  properties: {
    sourceRepo: { type: 'string' },
    results: {
      type: 'array',
      items: sharedRepoEntrySchema,
      maxItems: 5,
    },
  },
  additionalProperties: false,
};

const sharedReposRouteSchema = {
  querystring: githubQuerySchema,
  response: {
    200: sharedReposResponseSchema,
  },
};

export { sharedReposRouteSchema };
