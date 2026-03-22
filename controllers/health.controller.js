function getHealth(_request, reply) {
  return reply.send({ status: 'ok' });
}

function getHealthDetails(_request, reply) {
  return reply.send({
    status: 'ok',
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
}

export { getHealth, getHealthDetails };
