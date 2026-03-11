import { getHealth } from '#controllers/health.controller';

function handleHealthRoutes(ctx) {
  if (ctx.method === 'GET' && ctx.pathname === '/health') {
    getHealth(ctx);
    return true;
  }

  return false;
}

export { handleHealthRoutes };
