import { createReadStream } from 'node:fs';
import { PassThrough, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { stringify } from 'csv-stringify';
import { ERROR_MESSAGES } from '#constants/error-messages';
import { SUCCESS_MESSAGES } from '#constants/success-messages';
import * as deviceService from '#services/device.service';
import { getItemDetails } from '#services/item-details.service';
import { ITEM_EVENT_NAMES, itemEvents } from '../src/events/items.events.js';
import { NdjsonTransform } from '../src/transforms/ndjson.transform.js';
import { SmartHomeActiveTransform } from '../src/transforms/smart-home-active.transform.js';
import { withPublicImageUrl } from '../src/utils/image-url.utils.js';

const HTTP_STATUS_TEXT = {
  400: 'Bad Request',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
};

async function listDevices(request, reply) {
  const items = await deviceService.listDevices(request.query);
  const mappedItems = items.map((item) => withPublicImageUrl(item, request));
  return reply.send({ count: mappedItems.length, items: mappedItems });
}

async function listDevicesV2(request, reply) {
  const result = await deviceService.listDevicesPaginated(request.query);
  const mappedItems = result.items.map((item) => withPublicImageUrl(item, request));

  return reply.send({
    items: mappedItems,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
}

async function createDevice(request, reply) {
  const device = await deviceService.addDevice(request.body);
  itemEvents.emit(ITEM_EVENT_NAMES.CREATED, device);

  return reply.code(201).send({
    message: SUCCESS_MESSAGES.DEVICE_ADDED,
    device: withPublicImageUrl(device, request),
  });
}

async function updateDevice(request, reply) {
  const device = await deviceService.updateDevice(request.params.id, request.body);
  if (!device) {
    return reply.notFound(ERROR_MESSAGES.DEVICE_NOT_FOUND);
  }

  itemEvents.emit(ITEM_EVENT_NAMES.UPDATED, device);

  return reply.send({
    message: SUCCESS_MESSAGES.DEVICE_UPDATED,
    device: withPublicImageUrl(device, request),
  });
}

async function deleteDevice(request, reply) {
  const removed = await deviceService.removeDevice(request.params.id);
  if (!removed) {
    return reply.notFound(ERROR_MESSAGES.DEVICE_NOT_FOUND);
  }

  itemEvents.emit(ITEM_EVENT_NAMES.DELETED, request.params.id);

  return reply.send({ message: SUCCESS_MESSAGES.DEVICE_REMOVED });
}

async function exportItems(request, reply) {
  const shouldTransform = request.query.transform === true;
  const columns = shouldTransform
    ? ['id', 'device', 'status', 'room', 'description', 'image', 'isActive']
    : ['id', 'device', 'status', 'room', 'description', 'image'];

  const sourceStream = deviceService.streamDevices(request.query);
  const publicImageUrlTransform = new Transform({
    objectMode: true,
    transform(item, _encoding, callback) {
      callback(null, withPublicImageUrl(item, request));
    },
  });
  const csvStream = stringify({
    header: true,
    columns,
  });
  const outputStream = new PassThrough();

  const streams = [sourceStream, publicImageUrlTransform];

  if (shouldTransform) {
    streams.push(new SmartHomeActiveTransform());
  }

  streams.push(csvStream, outputStream);

  pipeline(streams[0], ...streams.slice(1)).catch((error) => {
    outputStream.destroy(error);
  });

  reply.header('Content-Type', 'text/csv; charset=utf-8');
  reply.header('Content-Disposition', 'attachment; filename="items.csv"');

  return reply.send(outputStream);
}

async function streamItems(request, reply) {
  const sourceStream = deviceService.streamDevices(request.query);
  const publicImageUrlTransform = new Transform({
    objectMode: true,
    transform(item, _encoding, callback) {
      callback(null, withPublicImageUrl(item, request));
    },
  });
  const outputStream = new PassThrough();

  pipeline(sourceStream, publicImageUrlTransform, new NdjsonTransform(), outputStream).catch(
    (error) => {
      outputStream.destroy(error);
    },
  );

  reply.type('application/x-ndjson');
  return reply.send(outputStream);
}

async function importItems(request, reply) {
  const file = await request.file();

  if (!file) {
    return reply.badRequest('File is required');
  }

  try {
    const buffer = await file.toBuffer();
    const content = buffer.toString('utf-8');
    const report = await deviceService.importItemsFromBuffer(file.filename, content);

    return reply.send(report);
  } catch (error) {
    const statusCode = error.statusCode ?? 400;
    return reply.code(statusCode).send({
      statusCode,
      error: HTTP_STATUS_TEXT[statusCode] ?? 'Bad Request',
      message: error.message,
    });
  }
}

async function uploadItemImage(request, reply) {
  const file = await request.file();

  if (!file) {
    return reply.badRequest('Image file is required');
  }

  try {
    const updatedItem = await deviceService.uploadImageForDevice(request.params.id, file);

    if (!updatedItem) {
      return reply.notFound(ERROR_MESSAGES.DEVICE_NOT_FOUND);
    }

    return reply.send({
      message: SUCCESS_MESSAGES.IMAGE_UPLOADED,
      device: withPublicImageUrl(updatedItem, request),
    });
  } catch (error) {
    const statusCode = error.statusCode ?? 400;
    return reply.code(statusCode).send({
      statusCode,
      error: HTTP_STATUS_TEXT[statusCode] ?? 'Bad Request',
      message: error.message,
    });
  }
}

async function getItemExtendedDetails(request, reply) {
  const details = await getItemDetails(request.params.id, request.server.config.EXTERNAL_API_URL);

  if (!details) {
    return reply.notFound(ERROR_MESSAGES.DEVICE_NOT_FOUND);
  }

  const device = withPublicImageUrl(details, request);
  return reply.send(device);
}

async function downloadBackup(request, reply) {
  try {
    const backupFilePath = await deviceService.getBackupFilePath(request.params.timestamp);
    reply.type('application/gzip');
    reply.header('Content-Disposition', `attachment; filename="${request.params.timestamp}.gz"`);
    return reply.send(createReadStream(backupFilePath));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return reply.notFound(ERROR_MESSAGES.BACKUP_NOT_FOUND);
    }

    throw error;
  }
}

export {
  listDevices,
  listDevicesV2,
  createDevice,
  updateDevice,
  deleteDevice,
  exportItems,
  streamItems,
  importItems,
  uploadItemImage,
  getItemExtendedDetails,
  downloadBackup,
};
