import { fileURLToPath } from 'node:url';
import { buildApp } from './src/app/build-app.js';

const SHUTDOWN_TIMEOUT_MS = 10000;

async function startServer() {
  const fastify = await buildApp();

  try {
    await fastify.listen({
      port: fastify.config.PORT,
      host: fastify.config.HOSTNAME,
    });

    fastify.log.info(`Server running at http://${fastify.config.HOSTNAME}:${fastify.config.PORT}`);
  } catch (error) {
    fastify.log.error({ err: error }, 'Unable to start server');
    process.exit(1);
  }

  let isShuttingDown = false;

  function gracefulShutdown(signal) {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    fastify.log.info({ signal }, 'Shutdown signal received');

    const shutdownTimer = setTimeout(() => {
      fastify.log.error('Shutdown timeout exceeded. Forcing exit.');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    fastify
      .close()
      .then(() => {
        clearTimeout(shutdownTimer);
        process.exit(0);
      })
      .catch((error) => {
        clearTimeout(shutdownTimer);
        fastify.log.error({ err: error }, 'Error during server shutdown');
        process.exit(1);
      });
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  process.on('uncaughtException', (error) => {
    fastify.log.error({ err: error }, 'Uncaught exception');
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    fastify.log.error({ reason }, 'Unhandled rejection');
    gracefulShutdown('unhandledRejection');
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await startServer();
}

export { startServer };
