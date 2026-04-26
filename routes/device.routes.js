import {
  listDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  exportItems,
  streamItems,
  importItems,
  getItemExtendedDetails,
  uploadItemImage,
} from '#controllers/device.controller';
import {
  createDeviceRouteSchema,
  deleteDeviceRouteSchema,
  exportItemsRouteSchema,
  importItemsRouteSchema,
  itemDetailsRouteSchema,
  listDevicesRouteSchema,
  streamItemsRouteSchema,
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
  fastify.get('/items/stream', { schema: streamItemsRouteSchema }, streamItems);
  fastify.post('/items/import', { schema: importItemsRouteSchema }, importItems);
  fastify.get('/items/:id/details', { schema: itemDetailsRouteSchema }, getItemExtendedDetails);
  fastify.post('/items/:id/image', { schema: uploadItemImageRouteSchema }, uploadItemImage);
}

export { registerDeviceRoutes };
