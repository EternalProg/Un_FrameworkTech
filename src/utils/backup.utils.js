import { copyFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { backupsDirectoryPath, itemsDirectoryPath } from './path.utils.js';
import { ensureDirectory } from './file.utils.js';

const MAX_BACKUP_COUNT = 5;

async function createDataBackup() {
  await ensureDirectory(itemsDirectoryPath);
  await ensureDirectory(backupsDirectoryPath);

  const itemFiles = await readdir(itemsDirectoryPath, { withFileTypes: true });
  const jsonFiles = itemFiles.filter((entry) => entry.isFile() && entry.name.endsWith('.json'));

  if (!jsonFiles.length) {
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetDirectoryPath = path.join(backupsDirectoryPath, timestamp);
  await ensureDirectory(targetDirectoryPath);

  await Promise.all(
    jsonFiles.map((entry) =>
      copyFile(
        path.join(itemsDirectoryPath, entry.name),
        path.join(targetDirectoryPath, entry.name),
      ),
    ),
  );

  await keepLatestBackups();
}

async function keepLatestBackups() {
  const backupEntries = await readdir(backupsDirectoryPath, { withFileTypes: true });
  const directories = backupEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left));

  const staleDirectories = directories.slice(MAX_BACKUP_COUNT);

  await Promise.all(
    staleDirectories.map((directoryName) =>
      rm(path.join(backupsDirectoryPath, directoryName), { recursive: true, force: true }),
    ),
  );
}

export { createDataBackup };
