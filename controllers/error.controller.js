import { ERROR_MESSAGES } from '#constants/error-messages';

function getError(request) {
  throw request.server.httpErrors.internalServerError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
}

function errorHandler(error, request, reply) {
  if (error.validation) {
    request.log.warn({ err: error }, 'Validation failed');
    return reply.badRequest(ERROR_MESSAGES.VALIDATION_ERROR);
  }

  const statusCode =
    error.statusCode && error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500;

  if (statusCode >= 500) {
    request.log.error({ err: error }, 'Unhandled server error');
    return reply.internalServerError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }

  request.log.warn({ err: error }, 'Request failed');
  return reply.code(statusCode).send({ error: error.message });
}

export { getError, errorHandler };
