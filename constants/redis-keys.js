const REDIS_KEYS = {
  EXTERNAL_REFERENCE: 'cache:external-reference',
  V2_ITEMS_PREFIX: 'cache:v2:items',
  JWT_ACCESS_BLACKLIST_PREFIX: 'auth:jwt:blacklist',
  JWT_REFRESH_PREFIX: 'auth:jwt:refresh',
};

function buildV2ItemsCacheKey(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);
  const room = query.room ?? '';

  return `${REDIS_KEYS.V2_ITEMS_PREFIX}:page=${page}:limit=${limit}:room=${room}`;
}

function buildJwtBlacklistKey(jti) {
  return `${REDIS_KEYS.JWT_ACCESS_BLACKLIST_PREFIX}:${jti}`;
}

function buildJwtRefreshKey(userId) {
  return `${REDIS_KEYS.JWT_REFRESH_PREFIX}:${userId}`;
}

export { REDIS_KEYS, buildJwtBlacklistKey, buildJwtRefreshKey, buildV2ItemsCacheKey };
