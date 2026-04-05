import { getCollections } from '../../lib/mongodb.js';
import { json, methodNotAllowed } from '../../lib/http.js';
import {
  clearSessionCookie,
  getSessionTokenFromRequest,
} from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  const token = getSessionTokenFromRequest(req);

  if (token) {
    const { sessions } = await getCollections();
    await sessions.deleteOne({ token });
  }

  clearSessionCookie(res);
  return json(res, 200, { success: true });
}
