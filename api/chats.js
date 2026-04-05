import { ObjectId } from 'mongodb';
import { getCollections, serializeDocument } from '../lib/mongodb.js';
import { json, methodNotAllowed, parseJsonBody } from '../lib/http.js';

const DEMO_USER_ID = 'demo-user';

export default async function handler(req, res) {
  const { chats } = await getCollections();

  if (req.method === 'GET') {
    const items = await chats.find({ userId: DEMO_USER_ID }).sort({ starred: -1, updatedAt: -1 }).toArray();

    return json(res, 200, {
      chats: items.map((chat) => serializeDocument(chat)),
    });
  }

  if (req.method === 'PATCH') {
    const payload = await parseJsonBody(req);
    const { id, title, starred } = payload;

    if (!id || !ObjectId.isValid(id)) {
      return json(res, 400, { error: 'Valid chat id is required.' });
    }

    const updates = {};

    if (typeof title === 'string') {
      const trimmedTitle = title.trim();

      if (!trimmedTitle) {
        return json(res, 400, { error: 'Chat title cannot be empty.' });
      }

      updates.title = trimmedTitle;
    }

    if (typeof starred === 'boolean') {
      updates.starred = starred;
    }

    if (Object.keys(updates).length === 0) {
      return json(res, 400, { error: 'No chat updates were provided.' });
    }

    updates.updatedAt = new Date();

    await chats.updateOne(
      { _id: new ObjectId(id), userId: DEMO_USER_ID },
      { $set: updates },
    );

    const chat = await chats.findOne({ _id: new ObjectId(id), userId: DEMO_USER_ID });
    return json(res, 200, { chat: serializeDocument(chat) });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {};

    if (!id || !ObjectId.isValid(id)) {
      return json(res, 400, { error: 'Valid chat id is required.' });
    }

    await chats.deleteOne({ _id: new ObjectId(id), userId: DEMO_USER_ID });
    return json(res, 200, { success: true });
  }

  return methodNotAllowed(res, ['GET', 'PATCH', 'DELETE']);
}
