import { randomUUID } from 'node:crypto';
import { buildJwtBlacklistKey } from '#constants/redis-keys';
import {
  REFRESH_TOKEN_TTL_SECONDS,
  deleteRefreshToken,
  getRefreshToken,
  registerUser,
  saveRefreshToken,
  verifyCredentials,
} from '#services/auth.service';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_COOKIE_NAME = 'refreshToken';

function getRefreshCookieOptions(request) {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: request.server.config.NODE_ENV === 'production',
    path: '/api/v1/auth',
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  };
}

function signAccessToken(request, user) {
  return request.server.jwt.sign(
    {
      sub: String(user.id),
      type: 'access',
      jti: randomUUID(),
    },
    {
      expiresIn: ACCESS_TOKEN_TTL,
    },
  );
}

function signRefreshToken(request, user) {
  return request.server.jwt.sign(
    {
      sub: String(user.id),
      type: 'refresh',
      jti: randomUUID(),
    },
    {
      expiresIn: REFRESH_TOKEN_TTL,
    },
  );
}

function createAuthError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function registerHandler(request, reply) {
  const user = await registerUser(request.body);
  return reply.code(201).send({ user });
}

async function loginHandler(request, reply) {
  const user = await verifyCredentials(request.body);
  const accessToken = signAccessToken(request, user);
  const refreshToken = signRefreshToken(request, user);

  await saveRefreshToken(user.id, refreshToken);
  reply.setCookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions(request));

  return reply.send({ user, accessToken });
}

async function refreshHandler(request, reply) {
  const refreshToken = request.cookies[REFRESH_COOKIE_NAME];

  if (!refreshToken) {
    throw createAuthError('Refresh token is required', 401);
  }

  let payload;

  try {
    payload = await request.server.jwt.verify(refreshToken);
  } catch {
    throw createAuthError('Invalid refresh token', 401);
  }

  if (payload.type !== 'refresh' || !payload.sub) {
    throw createAuthError('Invalid refresh token', 401);
  }

  const userId = Number(payload.sub);
  const savedRefreshToken = await getRefreshToken(userId);

  if (!savedRefreshToken || savedRefreshToken !== refreshToken) {
    throw createAuthError('Invalid refresh token', 401);
  }

  const accessToken = signAccessToken(request, { id: userId });
  const nextRefreshToken = signRefreshToken(request, { id: userId });

  await saveRefreshToken(userId, nextRefreshToken);
  reply.setCookie(REFRESH_COOKIE_NAME, nextRefreshToken, getRefreshCookieOptions(request));

  return reply.send({ accessToken });
}

async function logoutHandler(request, reply) {
  const payload = request.user;

  if (payload?.jti && payload?.exp) {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const ttl = payload.exp - nowInSeconds;

    if (ttl > 0) {
      await request.server.redis.set(buildJwtBlacklistKey(payload.jti), '1', 'EX', ttl);
    }
  }

  if (payload?.sub) {
    await deleteRefreshToken(Number(payload.sub));
  }

  reply.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions(request));
  return reply.code(204).send();
}

export { loginHandler, logoutHandler, refreshHandler, registerHandler };
