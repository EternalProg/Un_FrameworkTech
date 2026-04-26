import { createWriteStream } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { parse as parseCsv } from 'csv-parse/sync';
import Ajv from 'ajv';
import * as deviceRepository from '#repositories/device.repository';
import { backupsDirectoryPath, getUploadDirectoryPath } from '../src/utils/path.utils.js';

const IMPORT_SCHEMA = {
  type: 'object',
  required: ['device', 'room'],
  properties: {
    device: { type: 'string', minLength: 1 },
    room: { type: 'string', minLength: 1 },
    status: { type: 'string', enum: ['on', 'off'] },
    description: { type: 'string' },
    image: { anyOf: [{ type: 'string', minLength: 1 }, { type: 'null' }] },
  },
  additionalProperties: false,
};

const FILE_SIZE_LIMIT_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': 'image.jpg',
  'image/png': 'image.png',
};

const ajv = new Ajv();
const validateImportRecord = ajv.compile(IMPORT_SCHEMA);

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeImportedRecord(rawRecord) {
  return {
    device: rawRecord.device,
    room: rawRecord.room,
    status: rawRecord.status || undefined,
    description: rawRecord.description || undefined,
    image: rawRecord.image || undefined,
  };
}

async function listDevices(query = {}) {
  let result = await deviceRepository.findAll();

  if (query.room) {
    result = result.filter((item) => item.room.toLowerCase() === query.room.toLowerCase());
  }

  return result;
}

async function listDevicesPaginated(query = {}) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);

  const normalizedPage = Number.isInteger(page) && page > 0 ? page : 1;
  const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;

  const items = await listDevices(query);
  const total = items.length;
  const totalPages = total ? Math.ceil(total / normalizedLimit) : 1;

  const startIndex = (normalizedPage - 1) * normalizedLimit;
  const paginatedItems = items.slice(startIndex, startIndex + normalizedLimit);

  return {
    items: paginatedItems,
    total,
    page: normalizedPage,
    limit: normalizedLimit,
    totalPages,
  };
}

async function addDevice(data) {
  return deviceRepository.create(data);
}

async function updateDevice(id, data) {
  return deviceRepository.update(id, data);
}

async function removeDevice(id) {
  return deviceRepository.remove(id);
}

function streamDevices(query = {}) {
  const roomFilter = query.room?.toLowerCase();

  return Readable.from(
    (async function* filterDevices() {
      for await (const item of deviceRepository.streamAll()) {
        if (roomFilter && item.room.toLowerCase() !== roomFilter) {
          continue;
        }

        yield item;
      }
    })(),
    { objectMode: true },
  );
}

function parseImportPayload(fileName, content) {
  if (fileName.endsWith('.json')) {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      throw createServiceError('Invalid JSON format', 400);
    }
  }

  if (fileName.endsWith('.csv')) {
    return parseCsv(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  }

  throw createServiceError('Unsupported file format. Use .csv or .json', 415);
}

async function importItemsFromBuffer(fileName, content) {
  const rows = parseImportPayload(fileName.toLowerCase(), content);

  let importedCount = 0;
  const rejected = [];

  for (let index = 0; index < rows.length; index += 1) {
    const rawRecord = rows[index];
    const record = normalizeImportedRecord(rawRecord);
    const isValid = validateImportRecord(record);

    if (!isValid) {
      rejected.push({
        row: index + 1,
        reason: ajv.errorsText(validateImportRecord.errors),
      });
      continue;
    }

    await deviceRepository.create(record);
    importedCount += 1;
  }

  return {
    importedCount,
    rejectedCount: rejected.length,
    rejected,
  };
}

async function uploadImageForDevice(id, filePart) {
  const fileName = ALLOWED_IMAGE_TYPES[filePart.mimetype];
  if (!fileName) {
    throw createServiceError('Only image/jpeg and image/png are allowed', 415);
  }

  const uploadDirectoryPath = getUploadDirectoryPath(id);
  await mkdir(uploadDirectoryPath, { recursive: true });

  const targetPath = path.join(uploadDirectoryPath, fileName);

  let receivedBytes = 0;
  filePart.file.on('data', (chunk) => {
    receivedBytes += chunk.length;
    if (receivedBytes > FILE_SIZE_LIMIT_BYTES) {
      filePart.file.destroy(new Error('Image size must be 5MB or less'));
    }
  });

  await pipeline(filePart.file, createWriteStream(targetPath));

  if (filePart.file.truncated) {
    throw createServiceError('Image size must be 5MB or less', 413);
  }

  const relativePath = `/${id}/${fileName}`;
  const updatedItem = await deviceRepository.update(id, { image: relativePath });

  return updatedItem;
}

async function getBackupFilePath(timestamp) {
  const backupFilePath = path.join(backupsDirectoryPath, `${timestamp}.gz`);
  await access(backupFilePath);
  return backupFilePath;
}

export {
  listDevices,
  listDevicesPaginated,
  addDevice,
  updateDevice,
  removeDevice,
  streamDevices,
  getBackupFilePath,
  importItemsFromBuffer,
  uploadImageForDevice,
};
