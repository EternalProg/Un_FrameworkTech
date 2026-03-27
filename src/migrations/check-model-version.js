import { getCurrentModelHash, getStoredModelHash } from './model-version.utils.js';

async function isModelHashChanged() {
  const currentHash = await getCurrentModelHash();
  const storedHash = await getStoredModelHash();

  if (!storedHash) {
    return false;
  }

  return currentHash !== storedHash;
}

export { isModelHashChanged };
