import argon2 from 'argon2';
import { buildJwtRefreshKey } from '#constants/redis-keys';

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

let userRepository = null;
let redisClient = null;

function setAuthServiceDependencies({ users, redis }) {
  userRepository = users;
  redisClient = redis;
}

function getUserRepository() {
  if (!userRepository) {
    throw new Error('User repository is not configured');
  }

  return userRepository;
}

function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client is not configured');
  }

  return redisClient;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const safeUser = { ...user };
  delete safeUser.password;

  return safeUser;
}

function createAuthError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function registerUser({ email, password }) {
  const existingUser = await getUserRepository().findByEmail(email);

  if (existingUser) {
    throw createAuthError('Email already in use', 409);
  }

  const hashedPassword = await argon2.hash(password);
  const createdUser = await getUserRepository().create({
    email,
    password: hashedPassword,
  });

  return sanitizeUser(createdUser);
}

async function verifyCredentials({ email, password }) {
  const user = await getUserRepository().findByEmail(email);

  if (!user) {
    throw createAuthError('Invalid email or password', 401);
  }

  const isValidPassword = await argon2.verify(user.password, password);

  if (!isValidPassword) {
    throw createAuthError('Invalid email or password', 401);
  }

  return sanitizeUser(user);
}

async function saveRefreshToken(userId, refreshToken) {
  await getRedisClient().set(
    buildJwtRefreshKey(userId),
    refreshToken,
    'EX',
    REFRESH_TOKEN_TTL_SECONDS,
  );
}

async function getRefreshToken(userId) {
  return getRedisClient().get(buildJwtRefreshKey(userId));
}

async function deleteRefreshToken(userId) {
  await getRedisClient().del(buildJwtRefreshKey(userId));
}

export {
  REFRESH_TOKEN_TTL_SECONDS,
  deleteRefreshToken,
  getRefreshToken,
  registerUser,
  saveRefreshToken,
  setAuthServiceDependencies,
  verifyCredentials,
};
