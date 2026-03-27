import path from 'node:path';

const dataDirectoryPath = path.join(process.cwd(), 'data');
const itemsDirectoryPath = path.join(dataDirectoryPath, 'items');
const backupsDirectoryPath = path.join(dataDirectoryPath, 'backups');
const uploadsDirectoryPath = path.join(process.cwd(), 'uploads');
const dataVersionFilePath = path.join(dataDirectoryPath, 'version.json');

function getItemFilePath(id) {
  return path.join(itemsDirectoryPath, `${id}.json`);
}

function getItemTempFilePath(id) {
  return path.join(itemsDirectoryPath, `${id}.tmp.json`);
}

function getUploadDirectoryPath(id) {
  return path.join(uploadsDirectoryPath, String(id));
}

export {
  dataDirectoryPath,
  itemsDirectoryPath,
  backupsDirectoryPath,
  uploadsDirectoryPath,
  dataVersionFilePath,
  getItemFilePath,
  getItemTempFilePath,
  getUploadDirectoryPath,
};
