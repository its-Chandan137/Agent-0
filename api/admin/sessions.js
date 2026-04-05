import { ObjectId } from 'mongodb';
import { getCollections, serializeDocument } from '../../lib/mongodb.js';
import { json, methodNotAllowed, parseJsonBody } from '../../lib/http.js';
import { assertAdminAuthorized, AuthError, isAuthError, pruneExpiredSessions } from '../../lib/auth.js';

export default async function handler(req, res) {
  try {
    assertAdminAuthorized(req);
    const { sessions } = await getCollections();
    await pruneExpiredSessions();

    if (req.method === 'GET') {
      const { userId } = req.query || {};

      if (!userId || !ObjectId.isValid(userId)) {
        throw new AuthError('Valid user id is required.', 400);
      }

      const items = await sessions
        .find({ userId: new ObjectId(userId) })
        .sort({ lastActive: -1 })
        .toArray();

      return json(res, 200, { sessions: items.map((entry) => serializeDocument(entry)) });
    }

    if (req.method === 'DELETE') {
      const payload = await parseJsonBody(req);
      const { sessionId } = payload;

      if (!sessionId || !ObjectId.isValid(sessionId)) {
        throw new AuthError('Valid session id is required.', 400);
      }

      await sessions.deleteOne({ _id: new ObjectId(sessionId) });
      return json(res, 200, { success: true });
    }

    return methodNotAllowed(res, ['GET', 'DELETE']);
  } catch (error) {
    if (isAuthError(error)) {
      return json(res, error.statusCode || 401, { error: error.message });
    }

    console.error('Admin sessions failed', error);
    return json(res, 500, { error: 'Could not complete admin session request.' });
  }
}
