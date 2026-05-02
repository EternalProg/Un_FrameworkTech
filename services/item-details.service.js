import { findDeviceById } from '#services/device.service';
import { REDIS_KEYS } from '#constants/redis-keys';

let redisClient = null;

function setItemDetailsDependencies({ redis }) {
  redisClient = redis;
}

function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client is not configured');
  }

  return redisClient;
}

const CACHE_TTL_SECONDS = 120;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000];
const FETCH_TIMEOUT_MS = 5000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`External service responded with ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchReferenceWithRetry(url) {
  let attemptError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      return await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    } catch (error) {
      attemptError = error;

      if (attempt < MAX_RETRIES - 1) {
        await wait(RETRY_DELAYS_MS[attempt]);
      }
    }
  }

  throw attemptError;
}

async function readReferenceCache() {
  const payload = await getRedisClient().get(REDIS_KEYS.EXTERNAL_REFERENCE);

  if (!payload) {
    return null;
  }

  return JSON.parse(payload);
}

async function writeReferenceCache(data) {
  await getRedisClient().set(
    REDIS_KEYS.EXTERNAL_REFERENCE,
    JSON.stringify(data),
    'EX',
    CACHE_TTL_SECONDS,
  );
}

function mapExternalData(item, references) {
  if (!Array.isArray(references) || !references.length) {
    return {
      id: null,
      type: null,
      powerWatt: null,
    };
  }

  const deviceName = item.device.toLowerCase();
  const matched = references.find((entry) => deviceName.includes(String(entry.type).toLowerCase()));
  const fallback = matched ?? references[0];

  return {
    id: fallback.id ?? null,
    type: fallback.type ?? null,
    powerWatt: fallback.powerWatt ?? null,
  };
}

async function getItemDetails(id, externalApiUrl) {
  const item = await findDeviceById(id);
  if (!item) {
    return null;
  }

  let references = await readReferenceCache();

  if (!references) {
    try {
      references = await fetchReferenceWithRetry(externalApiUrl);
      await writeReferenceCache(references);
    } catch {
      references = null;
    }
  }

  return {
    ...item,
    external: mapExternalData(item, references),
  };
}

export { getItemDetails, setItemDetailsDependencies };
