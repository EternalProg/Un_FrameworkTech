import { createReadStream, createWriteStream } from 'node:fs';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
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
  const targetFilePath = path.join(backupsDirectoryPath, `${timestamp}.gz`);

  const sourceStream = Readable.from(
    (async function* readItemsContent() {
      for (const entry of jsonFiles) {
        const itemFilePath = path.join(itemsDirectoryPath, entry.name);

        for await (const chunk of createReadStream(itemFilePath)) {
          yield chunk;
        }

        yield '\n';
      }
    })(),
  );

  await pipeline(sourceStream, createGzip(), createWriteStream(targetFilePath));

  await keepLatestBackups();
}

async function keepLatestBackups() {
  const backupEntries = await readdir(backupsDirectoryPath, { withFileTypes: true });
  const backupFiles = backupEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.gz'))
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left));

  const staleFiles = backupFiles.slice(MAX_BACKUP_COUNT);

  await Promise.all(
    staleFiles.map((fileName) => rm(path.join(backupsDirectoryPath, fileName), { force: true })),
  );
}

export { createDataBackup };
