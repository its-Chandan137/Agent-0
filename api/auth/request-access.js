import { getCollections } from '../../lib/mongodb.js';
import { json, methodNotAllowed, parseJsonBody } from '../../lib/http.js';
import { AuthError, isAuthError, normalizePhone } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const payload = await parseJsonBody(req);
    const name = String(payload.name || '').trim();
    const phone = normalizePhone(payload.phone);

    if (!name) {
      throw new AuthError('Name is required.', 400);
    }

    const { users } = await getCollections();
    const existingUser = await users.findOne({ phone });

    if (existingUser?.status === 'active') {
      return json(res, 200, { success: true, message: 'Already approved, please login.' });
    }

    if (existingUser?.status === 'pending') {
      return json(res, 200, { success: true, message: 'Already requested, wait for approval.' });
    }

    if (existingUser?.status === 'blocked') {
      return json(res, 403, { error: 'Access revoked. Contact the admin.' });
    }

    await users.insertOne({
      name,
      phone,
      status: 'pending',
      requestedAt: new Date(),
      approvedAt: null,
    });

    return json(res, 200, { success: true });
  } catch (error) {
    if (isAuthError(error)) {
      return json(res, error.statusCode || 400, { error: error.message });
    }

    console.error('Request access failed', error);
    return json(res, 500, { error: 'Could not submit access request.' });
  }
}
