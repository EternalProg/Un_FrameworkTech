import { beforeEach, describe, expect, it, vi } from 'vitest';
import argon2 from 'argon2';
import {
  deleteRefreshToken,
  getRefreshToken,
  REFRESH_TOKEN_TTL_SECONDS,
  registerUser,
  saveRefreshToken,
  setAuthServiceDependencies,
  verifyCredentials,
} from '#services/auth.service';

describe('auth.service', () => {
  let users;
  let redis;

  beforeEach(() => {
    users = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    };

    redis = {
      set: vi.fn(),
      get: vi.fn(),
      del: vi.fn(),
    };

    setAuthServiceDependencies({ users, redis });
  });

  it('registers new user and hides password in response', async () => {
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue({ id: 7, email: 'user@example.com', password: 'hashed-secret' });

    const user = await registerUser({ email: 'user@example.com', password: 'StrongPass123' });

    expect(users.create).toHaveBeenCalledOnce();
    expect(users.create.mock.calls[0][0].email).toBe('user@example.com');
    expect(users.create.mock.calls[0][0].password).not.toBe('StrongPass123');
    expect(user).toEqual({ id: 7, email: 'user@example.com' });
  });

  it('fails registration when email already exists', async () => {
    users.findByEmail.mockResolvedValue({ id: 1, email: 'user@example.com', password: 'hash' });

    await expect(
      registerUser({ email: 'user@example.com', password: 'StrongPass123' }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Email already in use',
    });

    expect(users.create).not.toHaveBeenCalled();
  });

  it('verifies credentials and returns sanitized user', async () => {
    const hash = await argon2.hash('StrongPass123');

    users.findByEmail.mockResolvedValue({
      id: 2,
      email: 'valid@example.com',
      password: hash,
    });

    const user = await verifyCredentials({ email: 'valid@example.com', password: 'StrongPass123' });

    expect(user).toEqual({ id: 2, email: 'valid@example.com' });
  });

  it('fails credentials check for unknown email', async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(
      verifyCredentials({ email: 'missing@example.com', password: 'StrongPass123' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });
  });

  it('stores refresh token with 7-day ttl', async () => {
    await saveRefreshToken(42, 'refresh-token');

    expect(redis.set).toHaveBeenCalledWith(
      'auth:jwt:refresh:42',
      'refresh-token',
      'EX',
      REFRESH_TOKEN_TTL_SECONDS,
    );
  });

  it('reads and deletes refresh token by user id', async () => {
    redis.get.mockResolvedValue('saved-token');

    const token = await getRefreshToken(11);
    await deleteRefreshToken(11);

    expect(token).toBe('saved-token');
    expect(redis.get).toHaveBeenCalledWith('auth:jwt:refresh:11');
    expect(redis.del).toHaveBeenCalledWith('auth:jwt:refresh:11');
  });
});
