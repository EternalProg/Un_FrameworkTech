import { getError } from '#controllers/error.controller';

function handleErrorRoutes(ctx) {
  if (ctx.method === 'GET' && ctx.pathname === '/error') {
    getError(ctx);
    return true;
  }

  return false;
}

export { handleErrorRoutes };
