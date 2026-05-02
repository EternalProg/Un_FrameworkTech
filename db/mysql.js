import fp from 'fastify-plugin';
import mysql from 'mysql2/promise';

async function mysqlPlugin(fastify) {
  const pool = mysql.createPool({
    host: fastify.config.MYSQL_HOST,
    port: fastify.config.MYSQL_PORT,
    user: fastify.config.MYSQL_USER,
    password: fastify.config.MYSQL_PASSWORD,
    database: fastify.config.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    await pool.query('SELECT 1');
  } catch (error) {
    await pool.end();
    fastify.log.error({ err: error }, 'MySQL connection failed');
    throw error;
  }

  fastify.decorate('mysql', pool);

  fastify.addHook('onClose', async () => {
    await pool.end();
  });
}

export default fp(mysqlPlugin, { name: 'mysql' });
