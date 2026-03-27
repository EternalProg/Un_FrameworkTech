import {
  listDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  exportItems,
  importItems,
} from '#controllers/device.controller';
import {
  createDeviceRouteSchema,
  deleteDeviceRouteSchema,
  importItemsRouteSchema,
  listDevicesRouteSchema,
  updateDeviceRouteSchema,
} from '#schemas/device.schema';

async function registerDeviceRoutes(fastify) {
  fastify.get('/devices', { schema: listDevicesRouteSchema }, listDevices);
  fastify.post('/devices', { schema: createDeviceRouteSchema }, createDevice);
  fastify.patch('/devices/:id', { schema: updateDeviceRouteSchema }, updateDevice);
  fastify.delete('/devices/:id', { schema: deleteDeviceRouteSchema }, deleteDevice);

  fastify.get('/items', { schema: listDevicesRouteSchema }, listDevices);
  fastify.post('/items', { schema: createDeviceRouteSchema }, createDevice);
  fastify.patch('/items/:id', { schema: updateDeviceRouteSchema }, updateDevice);
  fastify.delete('/items/:id', { schema: deleteDeviceRouteSchema }, deleteDevice);

  fastify.get('/items/export', exportItems);
  fastify.post('/items/import', { schema: importItemsRouteSchema }, importItems);
}

export { registerDeviceRoutes };
