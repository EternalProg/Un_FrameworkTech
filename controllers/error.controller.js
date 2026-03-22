function getError() {
  throw new Error('Internal Server Error');
}

function errorHandler(error, request, reply) {
  if (error.validation) {
    request.log.warn({ err: error }, 'Validation failed');
    return reply.code(400).send({ error: 'Validation error' });
  }

  request.log.error({ err: error }, 'Unhandled server error');
  return reply.code(500).send({ error: 'Internal Server Error' });
}

export { getError, errorHandler };
