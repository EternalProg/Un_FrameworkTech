import { ERROR_MESSAGES } from '#constants/error-messages';
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
  downloadBackup,
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
  getBackupRouteSchema,
} from '#schemas/device.schema';
import * as deviceService from '#services/device.service';
import { ITEM_EVENT_NAMES, itemEvents } from '../src/events/items.events.js';

async function requireAdminApiKey(request, reply) {
  const apiKeyHeader = request.headers['x-api-key'];
  const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;

  if (apiKey !== request.server.config.ADMIN_API_KEY) {
    return reply.unauthorized(ERROR_MESSAGES.UNAUTHORIZED);
  }
}

async function requireJwtAccessToken(request, reply) {
  await request.jwtVerify();

  if (request.user.type !== 'access') {
    return reply.unauthorized('Invalid access token');
  }
}

async function registerDeviceRoutes(fastify) {
  const sockets = new Set();

  const broadcast = (payload) => {
    const message = JSON.stringify(payload);

    for (const socket of sockets) {
      if (socket.readyState === 1) {
        socket.send(message);
      }
    }
  };

  const handleCreated = (item) => broadcast({ event: 'created', data: item });
  const handleUpdated = (item) => broadcast({ event: 'updated', data: item });
  const handleDeleted = (id) => broadcast({ event: 'deleted', id });

  itemEvents.on(ITEM_EVENT_NAMES.CREATED, handleCreated);
  itemEvents.on(ITEM_EVENT_NAMES.UPDATED, handleUpdated);
  itemEvents.on(ITEM_EVENT_NAMES.DELETED, handleDeleted);

  fastify.addHook('onClose', async () => {
    itemEvents.off(ITEM_EVENT_NAMES.CREATED, handleCreated);
    itemEvents.off(ITEM_EVENT_NAMES.UPDATED, handleUpdated);
    itemEvents.off(ITEM_EVENT_NAMES.DELETED, handleDeleted);

    for (const socket of sockets) {
      socket.close();
    }

    sockets.clear();
  });

  fastify.get('/devices', { schema: listDevicesRouteSchema }, listDevices);
  fastify.post('/devices', { schema: createDeviceRouteSchema }, createDevice);
  fastify.patch('/devices/:id', { schema: updateDeviceRouteSchema }, updateDevice);
  fastify.delete('/devices/:id', { schema: deleteDeviceRouteSchema }, deleteDevice);

  fastify.get('/items', { schema: listDevicesRouteSchema }, listDevices);
  fastify.register(async function registerProtectedItemRoutes(protectedRoutes) {
    protectedRoutes.addHook('onRequest', requireJwtAccessToken);

    const jwtSecurity = [{ bearerAuth: [] }];

    protectedRoutes.post(
      '/items',
      { schema: { ...createDeviceRouteSchema, security: jwtSecurity } },
      createDevice,
    );
    protectedRoutes.patch(
      '/items/:id',
      { schema: { ...updateDeviceRouteSchema, security: jwtSecurity } },
      updateDevice,
    );
    protectedRoutes.delete(
      '/items/:id',
      { schema: { ...deleteDeviceRouteSchema, security: jwtSecurity } },
      deleteDevice,
    );
    protectedRoutes.post(
      '/items/import',
      { schema: { ...importItemsRouteSchema, security: jwtSecurity } },
      importItems,
    );
    protectedRoutes.post(
      '/items/:id/image',
      { schema: { ...uploadItemImageRouteSchema, security: jwtSecurity } },
      uploadItemImage,
    );
  });

  fastify.get('/items/export', { schema: exportItemsRouteSchema }, exportItems);
  fastify.get('/items/stream', { schema: streamItemsRouteSchema }, streamItems);
  fastify.get('/items/ws', { websocket: true }, async (connection) => {
    const socket = connection.socket ?? connection;
    sockets.add(socket);

    const items = await deviceService.listDevices();
    socket.send(JSON.stringify({ event: 'snapshot', data: items }));

    socket.on('close', () => {
      sockets.delete(socket);
    });

    socket.on('error', () => {
      sockets.delete(socket);
    });
  });
  fastify.get('/items/:id/details', { schema: itemDetailsRouteSchema }, getItemExtendedDetails);
  fastify.get(
    '/backups/:timestamp',
    {
      onRequest: [requireAdminApiKey],
      schema: getBackupRouteSchema,
    },
    downloadBackup,
  );
}

export { registerDeviceRoutes };
