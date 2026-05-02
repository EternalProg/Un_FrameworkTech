import { getCurrentSchemaHash, getStoredSchemaHash } from './schema-version.utils.js';

async function isModelHashChanged(db) {
  const currentHash = await getCurrentSchemaHash();
  const storedHash = await getStoredSchemaHash(db);

  if (!storedHash) {
    return false;
  }

  return currentHash !== storedHash;
}

export { isModelHashChanged };
