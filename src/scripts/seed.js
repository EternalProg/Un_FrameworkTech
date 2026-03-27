import { rm } from 'node:fs/promises';
import { ensureDirectory, writeJsonFileAtomic } from '../utils/file.utils.js';
import { getItemFilePath, getItemTempFilePath, itemsDirectoryPath } from '../utils/path.utils.js';
import { buildItemWithDefaults } from '../models/item.model.js';

const seedItems = [
  {
    id: 1,
    device: 'Smart Lamp',
    status: 'on',
    room: 'Kitchen',
    description: 'Main kitchen lamp',
  },
  {
    id: 2,
    device: 'Smart Thermostat',
    status: 'off',
    room: 'Living room',
    description: 'Controls the living room temperature',
  },
];

async function seed() {
  await rm(itemsDirectoryPath, { recursive: true, force: true });
  await ensureDirectory(itemsDirectoryPath);

  for (const item of seedItems) {
    const preparedItem = buildItemWithDefaults(item);
    await writeJsonFileAtomic(getItemFilePath(item.id), getItemTempFilePath(item.id), preparedItem);
  }

  console.log(`Seed completed. Created ${seedItems.length} item files.`);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
