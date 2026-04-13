const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_API_VERSION = '2026-03-10';
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10000;

const sharedReposCache = new Map();

function createServiceError(message, statusCode = 502) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isIgnorableGitHubError(error) {
  return (
    error.message.includes('GitHub API error: 404') ||
    error.message.includes('GitHub API error: 422')
  );
}

function isIgnorableGraphQLError(error) {
  return error.message.includes('Could not resolve to a User');
}

function getCachedValue(cacheKey) {
  const cachedEntry = sharedReposCache.get(cacheKey);
  if (!cachedEntry) {
    return null;
  }

  if (Date.now() > cachedEntry.expiresAt) {
    sharedReposCache.delete(cacheKey);
    return null;
  }

  return cachedEntry.value;
}

function setCachedValue(cacheKey, value) {
  sharedReposCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value,
  });
}

function normalizeMaxLimit(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor(numeric);
}

function parseRepoPath(repoPath) {
  const [owner, repo] = String(repoPath || '').split('/');

  if (!owner || !repo) {
    return null;
  }

  return { owner, repo, fullName: `${owner}/${repo}` };
}

async function fetchGitHubJson(url, token = '') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'fastify-lab-client',
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(url, {
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw createServiceError('GitHub API request timeout', 504);
    }

    throw createServiceError('Failed to reach GitHub API', 502);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 403) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        throw createServiceError(
          'GitHub API rate limit exceeded. Add GITHUB_TOKEN to .env for authenticated requests.',
          503,
        );
      }

      throw createServiceError('GitHub API returned 403 Forbidden', 502);
    }

    throw createServiceError(`GitHub API error: ${response.status}`, 502);
  }

  return response.json();
}

async function fetchGitHubGraphQL(query, variables = {}, token = '') {
  if (!token) {
    throw createServiceError(
      'GitHub GraphQL API requires GITHUB_TOKEN. Configure token or use /api/v1 endpoint.',
      503,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'fastify-lab-client',
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw createServiceError('GitHub GraphQL request timeout', 504);
    }

    throw createServiceError('Failed to reach GitHub GraphQL API', 502);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 403) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        throw createServiceError('GitHub GraphQL API rate limit exceeded. Try again later.', 503);
      }
    }

    throw createServiceError(`GitHub GraphQL error: ${response.status}`, 502);
  }

  const payload = await response.json();

  if (Array.isArray(payload.errors) && payload.errors.length) {
    throw createServiceError(`GitHub GraphQL error: ${payload.errors[0].message}`, 502);
  }

  return payload.data;
}

async function getBaseContributors(fullName, token, maxContributors) {
  const contributors = [];
  let page = 1;

  while (contributors.length < maxContributors) {
    const pageData = await fetchGitHubJson(
      `${GITHUB_API_BASE}/repos/${fullName}/contributors?per_page=100&page=${page}`,
      token,
    );

    if (!Array.isArray(pageData) || !pageData.length) {
      break;
    }

    for (const entry of pageData) {
      if (!entry?.login) {
        continue;
      }

      contributors.push(entry.login);

      if (contributors.length >= maxContributors) {
        break;
      }
    }

    if (pageData.length < 100) {
      break;
    }

    page += 1;
  }

  return [...new Set(contributors)];
}

async function collectRepoScoresFromEvents(
  baseContributors,
  sourceRepo,
  token,
  maxEventsPerContributor,
) {
  const scores = new Map();

  for (const contributor of baseContributors) {
    let processedEvents = 0;
    let page = 1;

    while (processedEvents < maxEventsPerContributor) {
      let events;

      try {
        events = await fetchGitHubJson(
          `${GITHUB_API_BASE}/users/${contributor}/events/public?per_page=100&page=${page}`,
          token,
        );
      } catch (error) {
        if (isIgnorableGitHubError(error)) {
          break;
        }

        throw error;
      }

      if (!Array.isArray(events) || !events.length) {
        break;
      }

      for (const event of events) {
        if (!event?.repo?.name) {
          continue;
        }

        const repoName = event.repo.name;
        if (repoName.toLowerCase() === sourceRepo.toLowerCase()) {
          continue;
        }

        const users = scores.get(repoName) ?? new Set();
        users.add(contributor);
        scores.set(repoName, users);

        processedEvents += 1;
        if (processedEvents >= maxEventsPerContributor) {
          break;
        }
      }

      if (events.length < 100) {
        break;
      }

      page += 1;
    }
  }

  return scores;
}

const userContributedReposQuery = `
  query UserContributedRepos($login: String!, $cursor: String) {
    user(login: $login) {
      repositoriesContributedTo(
        first: 100
        after: $cursor
        includeUserRepositories: true
        contributionTypes: [COMMIT, PULL_REQUEST, ISSUE, REPOSITORY]
      ) {
        nodes {
          nameWithOwner
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

async function collectRepoScoresFromGraphQL(
  baseContributors,
  sourceRepo,
  token,
  maxReposPerContributor,
) {
  const scores = new Map();

  for (const contributor of baseContributors) {
    let cursor = null;
    let processedRepos = 0;

    while (processedRepos < maxReposPerContributor) {
      let data;

      try {
        data = await fetchGitHubGraphQL(
          userContributedReposQuery,
          {
            login: contributor,
            cursor,
          },
          token,
        );
      } catch (error) {
        if (isIgnorableGraphQLError(error)) {
          break;
        }

        throw error;
      }

      const reposConnection = data?.user?.repositoriesContributedTo;
      if (!reposConnection) {
        break;
      }

      const nodes = Array.isArray(reposConnection.nodes) ? reposConnection.nodes : [];
      if (!nodes.length) {
        break;
      }

      for (const node of nodes) {
        const repoName = node?.nameWithOwner;
        if (!repoName || repoName.toLowerCase() === sourceRepo.toLowerCase()) {
          continue;
        }

        const users = scores.get(repoName) ?? new Set();
        users.add(contributor);
        scores.set(repoName, users);

        processedRepos += 1;
        if (processedRepos >= maxReposPerContributor) {
          break;
        }
      }

      if (!reposConnection.pageInfo?.hasNextPage) {
        break;
      }

      cursor = reposConnection.pageInfo.endCursor;
      if (!cursor) {
        break;
      }
    }
  }

  return scores;
}

function mapScoresToTopRepos(scores, limit = 5) {
  return [...scores.entries()]
    .map(([repo, users]) => ({
      repo,
      sharedContributorsCount: users.size,
      sharedContributors: [...users].sort(),
    }))
    .sort(
      (left, right) =>
        right.sharedContributorsCount - left.sharedContributorsCount ||
        left.repo.localeCompare(right.repo),
    )
    .slice(0, limit);
}

async function getSharedReposV1(repoPath, token = '', options = {}) {
  const parsed = parseRepoPath(repoPath);
  if (!parsed) {
    throw createServiceError('Query parameter repo must have format owner/name', 400);
  }

  const maxContributors = normalizeMaxLimit(options.maxContributors);
  const maxEventsPerContributor = normalizeMaxLimit(options.maxEventsPerContributor);

  const cacheKey = `v1:${parsed.fullName}:${maxContributors}:${maxEventsPerContributor}`;
  const cachedValue = getCachedValue(cacheKey);
  if (cachedValue) {
    return cachedValue;
  }

  const baseContributors = await getBaseContributors(parsed.fullName, token, maxContributors);
  const scores = await collectRepoScoresFromEvents(
    baseContributors,
    parsed.fullName,
    token,
    maxEventsPerContributor,
  );

  const result = {
    sourceRepo: parsed.fullName,
    results: mapScoresToTopRepos(scores),
  };

  setCachedValue(cacheKey, result);
  return result;
}

async function getSharedReposV2(repoPath, token = '', options = {}) {
  const parsed = parseRepoPath(repoPath);
  if (!parsed) {
    throw createServiceError('Query parameter repo must have format owner/name', 400);
  }

  const maxContributors = normalizeMaxLimit(options.maxContributors);
  const maxEventsPerContributor = normalizeMaxLimit(options.maxEventsPerContributor);
  const maxCandidates = normalizeMaxLimit(options.maxCandidates);

  const cacheKey = `v2:${parsed.fullName}:${maxContributors}:${maxEventsPerContributor}:${maxCandidates}`;
  const cachedValue = getCachedValue(cacheKey);
  if (cachedValue) {
    return cachedValue;
  }

  const baseContributors = await getBaseContributors(parsed.fullName, token, maxContributors);
  let scores;

  try {
    scores = await collectRepoScoresFromGraphQL(
      baseContributors,
      parsed.fullName,
      token,
      maxEventsPerContributor,
    );
  } catch (error) {
    if (token) {
      throw error;
    }

    scores = await collectRepoScoresFromEvents(
      baseContributors,
      parsed.fullName,
      token,
      maxEventsPerContributor,
    );
  }

  const result = {
    sourceRepo: parsed.fullName,
    results: mapScoresToTopRepos(scores, maxCandidates).slice(0, 5),
  };

  setCachedValue(cacheKey, result);
  return result;
}

export { getSharedReposV1, getSharedReposV2 };
