import {
  listDevices,
  createDevice,
  updateDevice,
  deleteDevice,
} from '#controllers/device.controller';
import {
  createDeviceRouteSchema,
  deleteDeviceRouteSchema,
  listDevicesRouteSchema,
  updateDeviceRouteSchema,
} from '#schemas/device.schema';

async function registerDeviceRoutes(fastify) {
  fastify.get('/devices', { schema: listDevicesRouteSchema }, listDevices);

  fastify.post('/devices', { schema: createDeviceRouteSchema }, createDevice);

  fastify.patch('/devices/:id', { schema: updateDeviceRouteSchema }, updateDevice);

  fastify.delete('/devices/:id', { schema: deleteDeviceRouteSchema }, deleteDevice);
}

export { registerDeviceRoutes };
