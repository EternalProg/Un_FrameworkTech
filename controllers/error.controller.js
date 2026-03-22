function getError(_request, reply) {
  return reply.code(500).send({ error: 'Internal Server Error' });
}

export { getError };
