const { getHealth } = require('#controllers/health.controller');

function handleHealthRoutes(ctx) {
  if (ctx.method === 'GET' && ctx.pathname === '/health') {
    getHealth(ctx);
    return true;
  }

  return false;
}

module.exports = {
  handleHealthRoutes,
};
