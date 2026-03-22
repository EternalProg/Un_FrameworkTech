import { ERROR_MESSAGES } from '#constants/error-messages';
import { SUCCESS_MESSAGES } from '#constants/success-messages';
import * as deviceService from '#services/device.service';

function listDevices(request, reply) {
  const items = deviceService.listDevices(request.query);
  return reply.send({ count: items.length, items });
}

function createDevice(request, reply) {
  const device = deviceService.addDevice(request.body);
  return reply.code(201).send({ message: SUCCESS_MESSAGES.DEVICE_ADDED, device });
}

function updateDevice(request, reply) {
  const device = deviceService.updateDevice(request.params.id, request.body);
  if (!device) {
    return reply.notFound(ERROR_MESSAGES.DEVICE_NOT_FOUND);
  }

  return reply.send({ message: SUCCESS_MESSAGES.DEVICE_UPDATED, device });
}

function deleteDevice(request, reply) {
  const removed = deviceService.removeDevice(request.params.id);
  if (!removed) {
    return reply.notFound(ERROR_MESSAGES.DEVICE_NOT_FOUND);
  }

  return reply.send({ message: SUCCESS_MESSAGES.DEVICE_REMOVED });
}

export { listDevices, createDevice, updateDevice, deleteDevice };
