import * as deviceService from '#services/device.service';

function listDevices(request, reply) {
  const items = deviceService.listDevices(request.query);
  return reply.send({ count: items.length, items });
}

function createDevice(request, reply) {
  const device = deviceService.addDevice(request.body);
  return reply.code(201).send({ message: 'Device added', device });
}

function updateDevice(request, reply) {
  const device = deviceService.updateDevice(request.params.id, request.body);
  if (!device) {
    return reply.code(404).send({ error: 'Device not found' });
  }

  return reply.send({ message: 'Device updated', device });
}

function deleteDevice(request, reply) {
  const removed = deviceService.removeDevice(request.params.id);
  if (!removed) {
    return reply.code(404).send({ error: 'Device not found' });
  }

  return reply.send({ message: 'Device removed' });
}

export { listDevices, createDevice, updateDevice, deleteDevice };
