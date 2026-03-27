import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dataVersionFilePath } from '../utils/path.utils.js';
import { ensureDirectory, readJsonFile, writeJsonFileAtomic } from '../utils/file.utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modelFilePath = path.join(__dirname, '../models/item.model.js');

async function getCurrentModelHash() {
  const modelSource = await readFile(modelFilePath, 'utf-8');
  return createHash('md5').update(modelSource).digest('hex');
}

async function getStoredModelHash() {
  try {
    const version = await readJsonFile(dataVersionFilePath);
    return version.modelHash ?? null;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    return null;
  }
}

async function updateStoredModelHash(modelHash) {
  const directoryPath = path.dirname(dataVersionFilePath);
  await ensureDirectory(directoryPath);

  await writeJsonFileAtomic(dataVersionFilePath, `${dataVersionFilePath}.tmp`, {
    modelHash,
    updatedAt: new Date().toISOString(),
  });
}

export { getCurrentModelHash, getStoredModelHash, updateStoredModelHash };
