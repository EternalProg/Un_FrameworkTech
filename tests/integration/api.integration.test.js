import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../../src/app/build-app.js';

const describeIntegration = process.env.RUN_INTEGRATION === '1' ? describe : describe.skip;

describeIntegration('API integration (fastify.inject)', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp({ dotenvPath: '.env.test', skipBackup: true });
    await app.ready();
  });

  beforeEach(async () => {
    await app.redis.flushall();
    await app.mysql.query('DELETE FROM users');
    await app.mysql.query('DELETE FROM items');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerAndLogin() {
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'integration@example.com',
        password: 'password123',
      },
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'integration@example.com',
        password: 'password123',
      },
    });

    return {
      accessToken: loginResponse.json().accessToken,
      cookies: Array.isArray(loginResponse.headers['set-cookie'])
        ? loginResponse.headers['set-cookie'][0]
        : loginResponse.headers['set-cookie'],
    };
  }

  it('returns health status and protects health details without API key', async () => {
    const health = await app.inject({ method: 'GET', url: '/api/v1/health' });
    const detailsUnauthorized = await app.inject({ method: 'GET', url: '/api/v1/health/details' });
    const detailsAuthorized = await app.inject({
      method: 'GET',
      url: '/api/v1/health/details',
      headers: {
        'x-api-key': app.config.ADMIN_API_KEY,
      },
    });

    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ status: 'ok' });

    expect(detailsUnauthorized.statusCode).toBe(401);
    expect(detailsAuthorized.statusCode).toBe(200);
    expect(detailsAuthorized.json().status).toBe('ok');
  });

  it('returns 500 from error endpoint via global error handler', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/error' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Internal Server Error',
    });
  });

  it('completes auth flow register/login/refresh/logout and blocks token after logout', async () => {
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'auth@example.com',
        password: 'password123',
      },
    });

    expect(registerResponse.statusCode).toBe(201);
    expect(registerResponse.json().user).toEqual({
      id: expect.any(Number),
      email: 'auth@example.com',
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'auth@example.com',
        password: 'password123',
      },
    });

    expect(loginResponse.statusCode).toBe(200);
    const accessToken = loginResponse.json().accessToken;
    const cookieHeader = Array.isArray(loginResponse.headers['set-cookie'])
      ? loginResponse.headers['set-cookie'][0]
      : loginResponse.headers['set-cookie'];
    expect(accessToken).toEqual(expect.any(String));
    expect(cookieHeader).toEqual(expect.stringContaining('refreshToken='));

    const refreshResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      headers: {
        cookie: cookieHeader,
      },
    });

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.json().accessToken).toEqual(expect.any(String));

    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: {
        authorization: `Bearer ${accessToken}`,
        cookie: cookieHeader,
      },
    });

    expect(logoutResponse.statusCode).toBe(204);

    const protectedAfterLogout = await app.inject({
      method: 'POST',
      url: '/api/v1/items',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        device: 'Blocked item',
        room: 'Lab',
      },
    });

    expect(protectedAfterLogout.statusCode).toBe(401);
  });

  it('supports items CRUD with auth and keeps GET routes public', async () => {
    const unauthorizedCreate = await app.inject({
      method: 'POST',
      url: '/api/v1/items',
      payload: {
        device: 'Lamp',
        room: 'Kitchen',
      },
    });
    expect(unauthorizedCreate.statusCode).toBe(401);

    const { accessToken } = await registerAndLogin();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/items',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        device: 'Lamp',
        room: 'Kitchen',
        status: 'on',
      },
    });
    expect(createResponse.statusCode).toBe(201);

    const created = createResponse.json().device;

    const listResponse = await app.inject({ method: 'GET', url: '/api/v1/items' });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().count).toBe(1);

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/items/${created.id}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        status: 'off',
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().device.status).toBe('off');

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/v1/items/${created.id}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.json().message).toBe('Device removed');
  });

  it('returns export/stream responses and handles item details for missing item', async () => {
    const exportResponse = await app.inject({ method: 'GET', url: '/api/v1/items/export' });
    const streamResponse = await app.inject({ method: 'GET', url: '/api/v1/items/stream' });
    const detailsMissing = await app.inject({ method: 'GET', url: '/api/v1/items/999/details' });

    expect(exportResponse.statusCode).toBe(200);
    expect(exportResponse.headers['content-type']).toContain('text/csv');

    expect(streamResponse.statusCode).toBe(200);
    expect(streamResponse.headers['content-type']).toContain('application/x-ndjson');

    expect(detailsMissing.statusCode).toBe(404);
  });

  it('returns extended details by combining item and external service data', async () => {
    const { accessToken } = await registerAndLogin();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/items',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        device: 'Test Lamp',
        room: 'Office',
      },
    });

    const createdId = createResponse.json().device.id;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: 1, type: 'lamp', powerWatt: 9 }],
      }),
    );

    const detailsResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/items/${createdId}/details`,
    });

    expect(detailsResponse.statusCode).toBe(200);
    expect(detailsResponse.json().external).toEqual({ id: 1, type: 'lamp', powerWatt: 9 });
  });

  it('returns 400 for auth validation and 404 for unknown route', async () => {
    const badRegister = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'not-email',
        password: 'short',
      },
    });

    const missingRoute = await app.inject({ method: 'GET', url: '/api/v1/not-found-route' });

    expect(badRegister.statusCode).toBe(400);
    expect(badRegister.json().message).toBe('Validation error');

    expect(missingRoute.statusCode).toBe(404);
    expect(missingRoute.json().message).toBe('Route not found');
  });

  it('handles github shared repos endpoints with positive and negative scenarios', async () => {
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
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ login: 'alice' }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ repo: { name: 'other/repo-a' } }],
        }),
    );

    const v1Response = await app.inject({
      method: 'GET',
      url: '/api/v1/github/shared-repos?repo=org/main',
    });
    const v2Response = await app.inject({
      method: 'GET',
      url: '/api/v2/github/shared-repos?repo=org/main',
    });
    const badQueryResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/github/shared-repos?repo=invalid',
    });

    expect(v1Response.statusCode).toBe(200);
    expect(v1Response.json().sourceRepo).toBe('org/main');
    expect(v2Response.statusCode).toBe(200);
    expect(v2Response.json().sourceRepo).toBe('org/main');
    expect(badQueryResponse.statusCode).toBe(400);
  });

  it('returns paginated v2 items and caches result in redis', async () => {
    const { accessToken } = await registerAndLogin();

    await app.inject({
      method: 'POST',
      url: '/api/v1/items',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        device: 'One',
        room: 'A',
      },
    });

    await app.inject({
      method: 'POST',
      url: '/api/v1/items',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        device: 'Two',
        room: 'B',
      },
    });

    const first = await app.inject({ method: 'GET', url: '/api/v2/items?page=1&limit=1' });
    const second = await app.inject({ method: 'GET', url: '/api/v2/items?page=1&limit=1' });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(first.json().items).toHaveLength(1);
    expect(second.json()).toEqual(first.json());
  });
});
