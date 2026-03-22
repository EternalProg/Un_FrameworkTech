import { createValidator, formatAjvErrors } from '#utils/validation';
import {
  deviceQuerySchema,
  deviceCreateSchema,
  deviceUpdateSchema,
  deviceParamsSchema,
} from '#validators/device.schema';
import * as deviceService from '#services/device.service';

const validateDeviceQuery = createValidator(deviceQuerySchema);
const validateDeviceCreate = createValidator(deviceCreateSchema);
const validateDeviceUpdate = createValidator(deviceUpdateSchema);
const validateDeviceParams = createValidator(deviceParamsSchema);

function validateOrRespond(reply, validate, data) {
  const isValid = validate(data);
  if (isValid) return true;

  reply.code(400).send({
    error: 'Validation error',
    details: formatAjvErrors(validate.errors),
  });

  return false;
}

function listDevices(request, reply) {
  const query = { ...request.query };
  if (!validateOrRespond(reply, validateDeviceQuery, query)) return;

  const items = deviceService.listDevices(query);
  return reply.send({ count: items.length, items });
}

function createDevice(request, reply) {
  const data = request.body || {};
  if (!validateOrRespond(reply, validateDeviceCreate, data)) return;

  const device = deviceService.addDevice(data);
  return reply.code(201).send({ message: 'Device added', device });
}

function updateDevice(request, reply) {
  const params = { id: Number(request.params.id) };
  const data = request.body || {};

  if (!validateOrRespond(reply, validateDeviceParams, params)) return;
  if (!validateOrRespond(reply, validateDeviceUpdate, data)) return;

  const device = deviceService.updateDevice(params.id, data);
  if (!device) {
    return reply.code(404).send({ error: 'Device not found' });
  }

  return reply.send({ message: 'Device updated', device });
}

function deleteDevice(request, reply) {
  const params = { id: Number(request.params.id) };
  if (!validateOrRespond(reply, validateDeviceParams, params)) return;

  const removed = deviceService.removeDevice(params.id);
  if (!removed) {
    return reply.code(404).send({ error: 'Device not found' });
  }

  return reply.send({ message: 'Device removed' });
}

export { listDevices, createDevice, updateDevice, deleteDevice };
