import { getSharedReposV1Handler } from '#controllers/github.controller';
import { sharedReposRouteSchema } from '#schemas/github.schema';

async function registerGitHubV1Routes(fastify) {
  fastify.get('/github/shared-repos', { schema: sharedReposRouteSchema }, getSharedReposV1Handler);
}

export { registerGitHubV1Routes };
