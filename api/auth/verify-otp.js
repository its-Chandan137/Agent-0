import { ObjectId } from 'mongodb';
import { getCollections, serializeDocument } from '../../lib/mongodb.js';
import { json, methodNotAllowed, parseJsonBody } from '../../lib/http.js';
import {
  AuthError,
  clearSessionCookie,
  getRequestDevice,
  getRequestIp,
  isAuthError,
  normalizeEmail,
  pruneExpiredSessions,
  setSessionCookie,
  signSessionToken,
} from '../../lib/auth.js';

function normalizeOtp(value) {
  const normalized = String(value || '').trim();

  if (!/^\d{6}$/.test(normalized)) {
    throw new AuthError('Enter a valid 6 digit OTP.', 400);
  }

  return normalized;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const payload = await parseJsonBody(req);
    const email = normalizeEmail(payload.email);
    const otp = normalizeOtp(payload.otp);
    const { otps, users, sessions } = await getCollections();
    const now = new Date();

    await pruneExpiredSessions();

    const otpEntry = await otps.findOne({
      email,
      otp,
      used: false,
      expiresAt: { $gt: now },
    });

    if (!otpEntry) {
      throw new AuthError('Invalid or expired OTP.', 401);
    }

    await otps.updateOne({ _id: otpEntry._id }, { $set: { used: true } });

    const user = await users.findOne({ email });

    if (!user || user.status !== 'active') {
      clearSessionCookie(res);
      throw new AuthError('User is not approved for login.', 403);
    }

    const activeSessionCount = await sessions.countDocuments({
      userId: user._id instanceof ObjectId ? user._id : new ObjectId(user._id),
    });

    if (activeSessionCount >= 3) {
      throw new AuthError(
        'Max 3 devices reached. Ask admin to remove a device.',
        403,
      );
    }

    const token = signSessionToken({ userId: user._id, email: user.email });
    await sessions.insertOne({
      userId: user._id,
      token,
      device: getRequestDevice(req),
      ip: getRequestIp(req),
      lastActive: now,
      createdAt: now,
    });

    setSessionCookie(res, token);
    return json(res, 200, {
      success: true,
      user: {
        name: user.name,
        email: user.email,
        userId: serializeDocument(user._id),
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      return json(res, error.statusCode || 400, { error: error.message });
    }

    console.error('Verify OTP failed', error);
    return json(res, 500, { error: 'Could not verify OTP.' });
  }
}
