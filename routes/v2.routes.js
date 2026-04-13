import { listDevicesV2 } from '#controllers/device.controller';
import { listDevicesV2RouteSchema } from '#schemas/device.schema';

async function registerV2Routes(fastify) {
  fastify.get('/items', { schema: listDevicesV2RouteSchema }, listDevicesV2);
}

export { registerV2Routes };
