import { getCollections, serializeDocument } from '../lib/mongodb.js';
import { json, methodNotAllowed } from '../lib/http.js';

const DEMO_USER_ID = 'demo-user';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const { chats } = await getCollections();
  const items = await chats.find({ userId: DEMO_USER_ID }).sort({ updatedAt: -1 }).toArray();

  return json(res, 200, {
    chats: items.map((chat) => serializeDocument(chat)),
  });
}
