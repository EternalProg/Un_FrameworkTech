import { listDevicesV2 } from '#controllers/device.controller';
import { getSharedReposV2Handler } from '#controllers/github.controller';
import { listDevicesV2RouteSchema } from '#schemas/device.schema';
import { sharedReposRouteSchema } from '#schemas/github.schema';

async function registerV2Routes(fastify) {
  fastify.get('/items', { schema: listDevicesV2RouteSchema }, listDevicesV2);
  fastify.get('/github/shared-repos', { schema: sharedReposRouteSchema }, getSharedReposV2Handler);
}

export { registerV2Routes };
