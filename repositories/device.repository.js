import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { buildItemWithDefaults } from '../src/models/item.model.js';
import { ensureDirectory, readJsonFile, writeJsonFileAtomic } from '../src/utils/file.utils.js';
import {
  getItemFilePath,
  getItemTempFilePath,
  itemsDirectoryPath,
  uploadsDirectoryPath,
} from '../src/utils/path.utils.js';

async function listItemFiles() {
  await ensureDirectory(itemsDirectoryPath);
  const entries = await readdir(itemsDirectoryPath, { withFileTypes: true });

  return entries
    .filter(
      (entry) =>
        entry.isFile() && entry.name.endsWith('.json') && !entry.name.endsWith('.tmp.json'),
    )
    .sort((left, right) => Number.parseInt(left.name, 10) - Number.parseInt(right.name, 10))
    .map((entry) => path.join(itemsDirectoryPath, entry.name));
}

function streamAll() {
  return Readable.from(
    (async function* readAllItems() {
      const filePaths = await listItemFiles();

      for (const filePath of filePaths) {
        yield await readJsonFile(filePath);
      }
    })(),
    { objectMode: true },
  );
}

async function findAll() {
  const filePaths = await listItemFiles();
  const items = await Promise.all(filePaths.map((filePath) => readJsonFile(filePath)));

  return items.sort((left, right) => left.id - right.id);
}

async function findById(id) {
  try {
    return await readJsonFile(getItemFilePath(id));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

async function getNextId() {
  const items = await findAll();
  if (!items.length) {
    return 1;
  }

  return Math.max(...items.map((item) => item.id)) + 1;
}

async function create(data) {
  const id = await getNextId();
  const item = {
    ...buildItemWithDefaults(data),
    id,
  };

  await writeJsonFileAtomic(getItemFilePath(id), getItemTempFilePath(id), item);
  return item;
}

async function update(id, data) {
  const existingItem = await findById(id);
  if (!existingItem) {
    return null;
  }

  const updatedItem = {
    ...existingItem,
    ...data,
    id,
  };

  await writeJsonFileAtomic(getItemFilePath(id), getItemTempFilePath(id), updatedItem);
  return updatedItem;
}

async function remove(id) {
  try {
    await unlink(getItemFilePath(id));
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

async function removeAll() {
  await ensureDirectory(itemsDirectoryPath);
  const filePaths = await listItemFiles();
  await Promise.all(filePaths.map((filePath) => unlink(filePath)));
}

async function getUploadsRootPath() {
  await ensureDirectory(uploadsDirectoryPath);
  return uploadsDirectoryPath;
}

export { findAll, findById, create, update, remove, removeAll, streamAll, getUploadsRootPath };
