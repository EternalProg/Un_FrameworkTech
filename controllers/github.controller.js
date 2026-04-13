import { getSharedReposV1, getSharedReposV2 } from '#services/github.service';

function getGitHubOptions(serverConfig) {
  return {
    maxContributors: serverConfig.GITHUB_ANALYTICS_MAX_CONTRIBUTORS,
    maxEventsPerContributor: serverConfig.GITHUB_ANALYTICS_MAX_EVENTS,
    maxCandidates: serverConfig.GITHUB_ANALYTICS_MAX_CANDIDATES,
  };
}

async function getSharedReposV1Handler(request, reply) {
  try {
    const result = await getSharedReposV1(
      request.query.repo,
      request.server.config.GITHUB_TOKEN,
      getGitHubOptions(request.server.config),
    );
    return reply.send(result);
  } catch (error) {
    const statusCode = error.statusCode ?? 502;
    return reply.code(statusCode).send({
      statusCode,
      error:
        statusCode === 400
          ? 'Bad Request'
          : statusCode === 503
            ? 'Service Unavailable'
            : 'Bad Gateway',
      message: error.message,
    });
  }
}

async function getSharedReposV2Handler(request, reply) {
  try {
    const result = await getSharedReposV2(
      request.query.repo,
      request.server.config.GITHUB_TOKEN,
      getGitHubOptions(request.server.config),
    );
    return reply.send(result);
  } catch (error) {
    const statusCode = error.statusCode ?? 502;
    return reply.code(statusCode).send({
      statusCode,
      error:
        statusCode === 400
          ? 'Bad Request'
          : statusCode === 503
            ? 'Service Unavailable'
            : 'Bad Gateway',
      message: error.message,
    });
  }
}

export { getSharedReposV1Handler, getSharedReposV2Handler };
