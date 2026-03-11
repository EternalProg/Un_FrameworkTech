const { buildQuery } = require('#utils/query');
const {
  listDevices,
  createDevice,
  updateDevice,
  deleteDevice,
} = require('#controllers/device.controller');

function handleDeviceRoutes(ctx) {
  const { method, pathname, parsedUrl } = ctx;

  if (method === 'GET' && pathname === '/devices') {
    const query = buildQuery(parsedUrl.searchParams);
    listDevices({ ...ctx, query });
    return true;
  }

  if (method === 'POST' && pathname === '/devices') {
    createDevice(ctx);
    return true;
  }

  if (method === 'PATCH' && pathname.startsWith('/devices/')) {
    const id = pathname.split('/')[2];
    updateDevice({ ...ctx, params: { id } });
    return true;
  }

  if (method === 'DELETE' && pathname.startsWith('/devices/')) {
    const id = pathname.split('/')[2];
    deleteDevice({ ...ctx, params: { id } });
    return true;
  }

  return false;
}

module.exports = {
  handleDeviceRoutes,
};
