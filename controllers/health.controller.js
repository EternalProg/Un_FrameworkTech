const { sendJson } = require('#utils/response');

function getHealth({ res }) {
  sendJson(res, 200, {
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
}

module.exports = {
  getHealth,
};
