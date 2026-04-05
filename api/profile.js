import { getUserIdFromRequest, isAuthError } from '../lib/auth.js';
import { getCollections, serializeDocument } from '../lib/mongodb.js';
import { json, methodNotAllowed, parseJsonBody } from '../lib/http.js';
import { normalizeBudgetProfile } from '../lib/budgetContext.js';

export default async function handler(req, res) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (req.method === 'GET') {
      const { profiles } = await getCollections();
      const profile = await profiles.findOne({ userId });
      return json(res, 200, { profile: serializeDocument(profile) || normalizeBudgetProfile({}) });
    }

    if (req.method === 'POST') {
      const payload = await parseJsonBody(req);
      const nextProfile = normalizeBudgetProfile(payload);
      const { profiles } = await getCollections();

      await profiles.updateOne(
        { userId },
        {
          $set: {
            ...nextProfile,
            userId,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true },
      );

      const savedProfile = await profiles.findOne({ userId });
      return json(res, 200, { profile: serializeDocument(savedProfile) });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    if (isAuthError(error)) {
      return json(res, error.statusCode || 401, { error: error.message });
    }

    console.error('Profile route failed', error);
    return json(res, 500, { error: 'Could not process profile request.' });
  }
}
