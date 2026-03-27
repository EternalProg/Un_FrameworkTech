import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { ItemModel, buildItemWithDefaults } from '../models/item.model.js';
import {
  getCurrentModelHash,
  getStoredModelHash,
  updateStoredModelHash,
} from './model-version.utils.js';
import { ensureDirectory, readJsonFile, writeJsonFileAtomic } from '../utils/file.utils.js';
import { itemsDirectoryPath } from '../utils/path.utils.js';

async function migrate() {
  await ensureDirectory(itemsDirectoryPath);

  const currentHash = await getCurrentModelHash();
  const storedHash = await getStoredModelHash();

  if (!storedHash) {
    await updateStoredModelHash(currentHash);
    console.log('Version file created. Migration not required.');
    return;
  }

  if (storedHash === currentHash) {
    console.log('Migration not required. Model hash is unchanged.');
    return;
  }

  const itemEntries = await readdir(itemsDirectoryPath, { withFileTypes: true });
  const itemFiles = itemEntries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'));

  let migratedCount = 0;

  for (const fileEntry of itemFiles) {
    const itemFilePath = path.join(itemsDirectoryPath, fileEntry.name);
    const rawItem = await readJsonFile(itemFilePath);

    const migratedItem = {
      ...buildItemWithDefaults(rawItem),
      id: rawItem.id,
    };

    const tempPath = path.join(itemsDirectoryPath, fileEntry.name.replace('.json', '.tmp.json'));
    await writeJsonFileAtomic(itemFilePath, tempPath, migratedItem);
    migratedCount += 1;
  }

  await updateStoredModelHash(currentHash);

  console.log(
    `Migration completed. Migrated files: ${migratedCount}. Added defaults: ${Object.keys(ItemModel).join(', ')}`,
  );
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
