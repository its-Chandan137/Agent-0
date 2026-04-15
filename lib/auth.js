import crypto from 'crypto';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getCollections } from './mongodb.js';

export const SESSION_COOKIE_NAME = 'session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
export const OTP_MAX_AGE_MS = 10 * 60 * 1000;

export class AuthError extends Error {
  constructor(message = 'Unauthorized.', statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export function normalizeEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new AuthError('Enter a valid email address.', 400);
  }

  return normalized;
}

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET environment variable.');
  }

  return process.env.JWT_SECRET;
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function parseCookies(req) {
  return cookie.parse(req.headers.cookie || '');
}

export function getSessionTokenFromRequest(req) {
  const cookies = parseCookies(req);
  return cookies[SESSION_COOKIE_NAME] || null;
}

export function signSessionToken({ userId, email }) {
  return jwt.sign(
    {
      userId: String(userId),
      email,
      nonce: crypto.randomUUID(),
    },
    getJwtSecret(),
    { expiresIn: '7d' },
  );
}

export function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: SESSION_MAX_AGE,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    }),
  );
}

export function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 0,
      expires: new Date(0),
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    }),
  );
}

export function getRequestIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0].split(',')[0].trim();
  }

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || 'unknown';
}

export function getRequestDevice(req) {
  return req.headers['user-agent'] || 'Unknown device';
}

export async function pruneExpiredSessions() {
  const { sessions } = await getCollections();
  const cutoff = new Date(Date.now() - SESSION_MAX_AGE * 1000);
  await sessions.deleteMany({
    $or: [{ createdAt: { $lt: cutoff } }, { lastActive: { $lt: cutoff } }],
  });
}

async function verifySessionToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    throw new AuthError('Unauthorized.', 401);
  }
}

export async function getAuthContextFromRequest(req) {
  const token = getSessionTokenFromRequest(req);

  if (!token) {
    throw new AuthError('Unauthorized.', 401);
  }

  await pruneExpiredSessions();

  const payload = await verifySessionToken(token);

  if (!payload?.userId || !ObjectId.isValid(payload.userId)) {
    throw new AuthError('Unauthorized.', 401);
  }

  const userObjectId = new ObjectId(payload.userId);
  const { sessions, users } = await getCollections();
  const [session, user] = await Promise.all([
    sessions.findOne({ token }),
    users.findOne({ _id: userObjectId }),
  ]);

  if (!session || !user || user.status !== 'active') {
    throw new AuthError(user?.status === 'blocked' ? 'Access revoked.' : 'Unauthorized.', 401);
  }

  return {
    token,
    session,
    user,
    userId: userObjectId,
    payload,
  };
}

export async function getUserIdFromRequest(req) {
  const auth = await getAuthContextFromRequest(req);
  return auth.userId;
}

export function assertAdminAuthorized(req) {
  const header = req.headers.authorization || '';

  if (!process.env.ADMIN_PASSWORD) {
    throw new Error('Missing ADMIN_PASSWORD environment variable.');
  }

  if (!header.startsWith('Basic ')) {
    throw new AuthError('Unauthorized.', 401);
  }

  const encoded = header.slice(6);
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const separatorIndex = decoded.indexOf(':');
  const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : '';

  if (password !== process.env.ADMIN_PASSWORD) {
    throw new AuthError('Unauthorized.', 401);
  }
}

export function isAuthError(error) {
  return error instanceof AuthError || typeof error?.statusCode === 'number';
}
