import { getCollections } from '../../lib/mongodb.js';
import { json, methodNotAllowed, parseJsonBody } from '../../lib/http.js';
import {
  AuthError,
  OTP_MAX_AGE_MS,
  generateOtp,
  isAuthError,
  normalizeEmail,
} from '../../lib/auth.js';
import { sendOtpEmail } from '../../lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const payload = await parseJsonBody(req);
    const email = normalizeEmail(payload.email);
    const { users, otps } = await getCollections();
    const user = await users.findOne({ email });

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

    await otps.updateMany({ email, used: false }, { $set: { used: true } });
    await otps.insertOne({
      email,
      otp,
      expiresAt,
      used: false,
      createdAt: now,
    });

    await sendOtpEmail({ email, otp });

    return json(res, 200, { success: true });
  } catch (error) {
    if (isAuthError(error)) {
      return json(res, error.statusCode || 400, { error: error.message });
    }

    console.error('Send OTP failed', error);

    if (error?.code === 'EAUTH' || /authentication failed/i.test(String(error?.response || error?.message || ''))) {
      return json(res, 500, {
        error:
          'Email sender authentication failed. Check BREVO_SMTP_USER and BREVO_SMTP_PASS, then restart the dev server.',
      });
    }

    return json(res, 500, { error: 'Could not send OTP.' });
  }
}
