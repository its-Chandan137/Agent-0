import { getCollections } from '../../lib/mongodb.js';
import { json, methodNotAllowed } from '../../lib/http.js';
import {
  clearSessionCookie,
  getAuthContextFromRequest,
  isAuthError,
  setSessionCookie,
} from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  try {
    const auth = await getAuthContextFromRequest(req);
    const now = new Date();
    const { sessions } = await getCollections();

    await sessions.updateOne(
      { _id: auth.session._id },
      { $set: { lastActive: now } },
    );

    setSessionCookie(res, auth.token);

    return json(res, 200, {
      user: {
        name: auth.user.name,
        phone: auth.user.phone,
        userId: auth.user._id.toString(),
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      clearSessionCookie(res);
      return json(res, error.statusCode || 401, { error: error.message });
    }

    console.error('Auth me failed', error);
    return json(res, 500, { error: 'Could not fetch session.' });
  }
}
