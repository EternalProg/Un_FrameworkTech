import { ERROR_MESSAGES } from '#constants/error-messages';
import { SUCCESS_MESSAGES } from '#constants/success-messages';
import * as deviceService from '#services/device.service';
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

async function createDevice(request, reply) {
  const device = await deviceService.addDevice(request.body);
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

  return reply.send({ message: SUCCESS_MESSAGES.DEVICE_REMOVED });
}

async function exportItems(request, reply) {
  const items = await deviceService.listDevices(request.query);
  const rows = items.map((item) => withPublicImageUrl(item, request));
  const csvContent = await deviceService.exportItemsToCsv(rows);

  reply.header('Content-Type', 'text/csv; charset=utf-8');
  reply.header('Content-Disposition', 'attachment; filename="items.csv"');

  return reply.send(csvContent);
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

export {
  listDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  exportItems,
  importItems,
  uploadItemImage,
};
