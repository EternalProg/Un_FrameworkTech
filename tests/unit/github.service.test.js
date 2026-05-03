import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSharedReposV1, getSharedReposV2 } from '#services/github.service';

describe('github.service', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects malformed repo path with 400', async () => {
    await expect(getSharedReposV1('invalid-repo')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Query parameter repo must have format owner/name',
    });
  });

  it('maps contributors events into sorted shared repos list', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ login: 'alice' }, { login: 'bob' }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { repo: { name: 'other/repo-a' } },
            { repo: { name: 'other/repo-b' } },
          ],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ repo: { name: 'other/repo-a' } }],
        }),
    );

    const result = await getSharedReposV1('org/main');

    expect(result.sourceRepo).toBe('org/main');
    expect(result.results[0]).toEqual({
      repo: 'other/repo-a',
      sharedContributorsCount: 2,
      sharedContributors: ['alice', 'bob'],
    });
  });

  it('falls back to events in v2 when token is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ login: 'alice' }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ repo: { name: 'other/repo-a' } }],
        }),
    );

    const result = await getSharedReposV2('org/main');

    expect(result.sourceRepo).toBe('org/main');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].repo).toBe('other/repo-a');
  });
});
