import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';

async function ensureDirectory(pathToDirectory) {
  await mkdir(pathToDirectory, { recursive: true });
}

async function readJsonFile(filePath) {
  const rawData = await readFile(filePath, 'utf-8');
  return JSON.parse(rawData);
}

async function writeJsonFileAtomic(targetPath, tempPath, data) {
  const payload = `${JSON.stringify(data, null, 2)}\n`;

  try {
    await writeFile(tempPath, payload, 'utf-8');
    await rename(tempPath, targetPath);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
}

export { ensureDirectory, readJsonFile, writeJsonFileAtomic };
