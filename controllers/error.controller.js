import { ERROR_MESSAGES } from '#constants/error-messages';

const HTTP_STATUS_TEXT = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
};

function getError(request) {
  throw request.server.httpErrors.internalServerError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
}

function errorHandler(error, request, reply) {
  if (error.validation) {
    request.log.warn({ err: error }, 'Validation failed');
    return reply.code(400).send({
      statusCode: 400,
      error: HTTP_STATUS_TEXT[400],
      message: ERROR_MESSAGES.VALIDATION_ERROR,
    });
  }

  const statusCode =
    error.statusCode && error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500;

  if (statusCode >= 500) {
    request.log.error({ err: error }, 'Unhandled server error');
    return reply.code(500).send({
      statusCode: 500,
      error: HTTP_STATUS_TEXT[500],
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  }

  request.log.warn({ err: error }, 'Request failed');
  return reply.code(statusCode).send({
    statusCode,
    error: HTTP_STATUS_TEXT[statusCode] ?? 'Error',
    message: error.message,
  });
}

export { getError, errorHandler };
