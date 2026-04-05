import { ObjectId } from 'mongodb';
import { getCollections, serializeDocument } from '../../lib/mongodb.js';
import { json, methodNotAllowed, parseJsonBody } from '../../lib/http.js';
import { assertAdminAuthorized, AuthError, isAuthError, pruneExpiredSessions } from '../../lib/auth.js';

export default async function handler(req, res) {
  try {
    assertAdminAuthorized(req);
    const { users, sessions } = await getCollections();
    await pruneExpiredSessions();

    if (req.method === 'GET') {
      const [userItems, sessionCounts] = await Promise.all([
        users.find({}).sort({ requestedAt: -1 }).toArray(),
        sessions
          .aggregate([
            {
              $group: {
                _id: '$userId',
                count: { $sum: 1 },
              },
            },
          ])
          .toArray(),
      ]);

      const sessionCountMap = new Map(
        sessionCounts.map((entry) => [String(entry._id), entry.count]),
      );

      return json(res, 200, {
        users: userItems.map((user) => ({
          ...serializeDocument(user),
          sessionCount: sessionCountMap.get(String(user._id)) || 0,
        })),
      });
    }

    if (req.method === 'POST') {
      const payload = await parseJsonBody(req);
      const { userId, action } = payload;

      if (!userId || !ObjectId.isValid(userId)) {
        throw new AuthError('Valid user id is required.', 400);
      }

      if (action !== 'approve' && action !== 'block') {
        throw new AuthError('Action must be approve or block.', 400);
      }

      const updates =
        action === 'approve'
          ? {
              status: 'active',
              approvedAt: new Date(),
            }
          : {
              status: 'blocked',
            };

      await users.updateOne({ _id: new ObjectId(userId) }, { $set: updates });

      return json(res, 200, { success: true });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    if (isAuthError(error)) {
      return json(res, error.statusCode || 401, { error: error.message });
    }

    console.error('Admin users failed', error);
    return json(res, 500, { error: 'Could not complete admin user request.' });
  }
}
