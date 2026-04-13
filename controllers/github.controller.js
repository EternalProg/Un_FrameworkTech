import { getSharedReposV1, getSharedReposV2 } from '#services/github.service';

async function getSharedReposV1Handler(request, reply) {
  try {
    const result = await getSharedReposV1(request.query.repo);
    return reply.send(result);
  } catch (error) {
    const statusCode = error.message.includes('format') ? 400 : 502;
    return reply.code(statusCode).send({
      statusCode,
      error: statusCode === 400 ? 'Bad Request' : 'Bad Gateway',
      message: error.message,
    });
  }
}

async function getSharedReposV2Handler(request, reply) {
  try {
    const result = await getSharedReposV2(request.query.repo);
    return reply.send(result);
  } catch (error) {
    const statusCode = error.message.includes('format') ? 400 : 502;
    return reply.code(statusCode).send({
      statusCode,
      error: statusCode === 400 ? 'Bad Request' : 'Bad Gateway',
      message: error.message,
    });
  }
}

export { getSharedReposV1Handler, getSharedReposV2Handler };
