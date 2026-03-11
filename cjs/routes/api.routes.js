const userController = require('../controllers/user.controller.js');
const { getStats } = require('../state/request-counter.js');

const getUserByIdSchema = {
  schema: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'integer' }
      },
      required: ['id']
    }
  }
};

async function apiRoutes(fastify, options) {
  fastify.get('/health', async () => ({ status: 'ok' }));

  fastify.get('/users',     userController.getUsers);
  fastify.get('/users/:id', getUserByIdSchema, userController.getUserById);

  fastify.get('/stats', async () => getStats());
}

module.exports = apiRoutes;
