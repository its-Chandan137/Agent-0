import { getCollections, serializeDocument } from '../lib/mongodb.js';
import { json, methodNotAllowed, parseJsonBody } from '../lib/http.js';
import { normalizeBudgetProfile } from '../lib/budgetContext.js';

const DEMO_USER_ID = 'demo-user';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { profiles } = await getCollections();
    const profile = await profiles.findOne({ userId: DEMO_USER_ID });
    return json(res, 200, { profile: serializeDocument(profile) || normalizeBudgetProfile({}) });
  }

  if (req.method === 'POST') {
    const payload = await parseJsonBody(req);
    const nextProfile = normalizeBudgetProfile(payload);
    const { profiles } = await getCollections();

    await profiles.updateOne(
      { userId: DEMO_USER_ID },
      {
        $set: {
          ...nextProfile,
          userId: DEMO_USER_ID,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    const savedProfile = await profiles.findOne({ userId: DEMO_USER_ID });
    return json(res, 200, { profile: serializeDocument(savedProfile) });
  }

  return methodNotAllowed(res, ['GET', 'POST']);
}
