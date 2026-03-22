import {
  listDevices,
  createDevice,
  updateDevice,
  deleteDevice,
} from '#controllers/device.controller';

async function registerDeviceRoutes(fastify) {
  fastify.get('/devices', listDevices);
  fastify.post('/devices', createDevice);
  fastify.patch('/devices/:id', updateDevice);
  fastify.delete('/devices/:id', deleteDevice);
}

export { registerDeviceRoutes };
