import {
  listDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  exportItems,
  importItems,
  uploadItemImage,
} from '#controllers/device.controller';
import {
  createDeviceRouteSchema,
  deleteDeviceRouteSchema,
  exportItemsRouteSchema,
  importItemsRouteSchema,
  listDevicesRouteSchema,
  updateDeviceRouteSchema,
  uploadItemImageRouteSchema,
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

  fastify.get('/items/export', { schema: exportItemsRouteSchema }, exportItems);
  fastify.post('/items/import', { schema: importItemsRouteSchema }, importItems);
  fastify.post('/items/:id/image', { schema: uploadItemImageRouteSchema }, uploadItemImage);
}

export { registerDeviceRoutes };
