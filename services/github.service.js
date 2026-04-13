const GITHUB_API_BASE = 'https://api.github.com';

function parseRepoPath(repoPath) {
  const [owner, repo] = String(repoPath || '').split('/');

  if (!owner || !repo) {
    return null;
  }

  return { owner, repo, fullName: `${owner}/${repo}` };
}

async function fetchGitHubJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'fastify-lab-client',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

async function getBaseContributors(fullName) {
  const contributors = await fetchGitHubJson(
    `${GITHUB_API_BASE}/repos/${fullName}/contributors?per_page=100`,
  );

  return contributors.map((entry) => entry.login).filter(Boolean);
}

async function collectRepoScoresFromEvents(baseContributors, sourceRepo) {
  const scores = new Map();

  for (const contributor of baseContributors) {
    const events = await fetchGitHubJson(
      `${GITHUB_API_BASE}/users/${contributor}/events/public?per_page=100`,
    );

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

async function getSharedReposV1(repoPath) {
  const parsed = parseRepoPath(repoPath);
  if (!parsed) {
    throw new Error('Query parameter repo must have format owner/name');
  }

  const baseContributors = await getBaseContributors(parsed.fullName);
  const scores = await collectRepoScoresFromEvents(baseContributors, parsed.fullName);

  return {
    sourceRepo: parsed.fullName,
    results: mapScoresToTopRepos(scores),
  };
}

async function getSharedReposV2(repoPath) {
  const parsed = parseRepoPath(repoPath);
  if (!parsed) {
    throw new Error('Query parameter repo must have format owner/name');
  }

  const baseContributors = await getBaseContributors(parsed.fullName);
  const baseContributorSet = new Set(baseContributors);
  const scoresFromEvents = await collectRepoScoresFromEvents(baseContributors, parsed.fullName);
  const candidates = mapScoresToTopRepos(scoresFromEvents, 30).map((entry) => entry.repo);

  const verified = [];

  for (const candidate of candidates) {
    const contributors = await fetchGitHubJson(
      `${GITHUB_API_BASE}/repos/${candidate}/contributors?per_page=100`,
    );

    const sharedContributors = contributors
      .map((entry) => entry.login)
      .filter((login) => baseContributorSet.has(login))
      .sort();

    if (!sharedContributors.length) {
      continue;
    }

    verified.push({
      repo: candidate,
      sharedContributorsCount: sharedContributors.length,
      sharedContributors,
    });
  }

  verified.sort(
    (left, right) =>
      right.sharedContributorsCount - left.sharedContributorsCount ||
      left.repo.localeCompare(right.repo),
  );

  return {
    sourceRepo: parsed.fullName,
    results: verified.slice(0, 5),
  };
}

export { getSharedReposV1, getSharedReposV2 };
