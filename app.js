import { createServer } from 'node:http';
import config from '#config';
import { handleHealthRoutes } from '#routes/health.routes';
import { handleErrorRoutes } from '#routes/error.routes';
import { handleDeviceRoutes } from '#routes/device.routes';
import { logRequest } from '#utils/logger';
import { sendError } from '#utils/response';

const server = createServer((req, res) => {
  const method = req.method;
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  res.on('finish', () => {
    logRequest(method, pathname, res.statusCode);
  });

  const ctx = { req, res, method, pathname, parsedUrl };

  const handled = handleHealthRoutes(ctx) || handleErrorRoutes(ctx) || handleDeviceRoutes(ctx);

  if (!handled) {
    sendError(res, 404, 'Route not found');
  }
});

server.listen(config.PORT, config.HOSTNAME, () => {
  console.log(`Server running at http://${config.HOSTNAME}:${config.PORT}`);
});

const SHUTDOWN_TIMEOUT_MS = 10000;
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}. Shutting down...`);

  const shutdownTimer = setTimeout(() => {
    console.error('Shutdown timeout exceeded. Forcing exit.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  server.close((err) => {
    clearTimeout(shutdownTimer);
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  gracefulShutdown('unhandledRejection');
});
