import twilio from 'twilio';
import { getCollections } from '../../lib/mongodb.js';
import { json, methodNotAllowed, parseJsonBody } from '../../lib/http.js';
import {
  AuthError,
  OTP_MAX_AGE_MS,
  generateOtp,
  isAuthError,
  normalizePhone,
} from '../../lib/auth.js';

let cachedTwilioClient;

function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    throw new Error('Missing Twilio environment variables.');
  }

  if (!cachedTwilioClient) {
    cachedTwilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  return cachedTwilioClient;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const payload = await parseJsonBody(req);
    const phone = normalizePhone(payload.phone);
    const { users, otps } = await getCollections();
    const user = await users.findOne({ phone });

    if (!user) {
      throw new AuthError('Request access first.', 403);
    }

    if (user.status === 'pending') {
      throw new AuthError('Access pending approval.', 403);
    }

    if (user.status === 'blocked') {
      throw new AuthError('Access revoked.', 403);
    }

    const otp = generateOtp();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_MAX_AGE_MS);

    await otps.updateMany({ phone, used: false }, { $set: { used: true } });
    await otps.insertOne({
      phone,
      otp,
      expiresAt,
      used: false,
      createdAt: now,
    });

    await getTwilioClient().messages.create({
      body: `Your Mantra OTP is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    return json(res, 200, { success: true });
  } catch (error) {
    if (isAuthError(error)) {
      return json(res, error.statusCode || 400, { error: error.message });
    }

    console.error('Send OTP failed', error);
    return json(res, 500, { error: 'Could not send OTP.' });
  }
}
