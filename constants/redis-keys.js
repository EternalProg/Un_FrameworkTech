const REDIS_KEYS = {
  EXTERNAL_REFERENCE: 'cache:external-reference',
  V2_ITEMS_PREFIX: 'cache:v2:items',
};

function buildV2ItemsCacheKey(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);
  const room = query.room ?? '';

  return `${REDIS_KEYS.V2_ITEMS_PREFIX}:page=${page}:limit=${limit}:room=${room}`;
}

export { REDIS_KEYS, buildV2ItemsCacheKey };
