import { ObjectId } from 'mongodb';
import { getCollections, serializeDocument } from '../lib/mongodb.js';
import { json, methodNotAllowed, parseJsonBody } from '../lib/http.js';
import { normalizeWishlistItem } from '../lib/budgetContext.js';

const DEMO_USER_ID = 'demo-user';

async function listItems() {
  const { wishlist } = await getCollections();
  const items = await wishlist.find({ userId: DEMO_USER_ID }).sort({ dateAdded: -1 }).toArray();
  return items.map((item) => serializeDocument(item));
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return json(res, 200, { items: await listItems() });
  }

  if (req.method === 'POST') {
    const payload = await parseJsonBody(req);
    const nextItem = normalizeWishlistItem(payload);

    if (!nextItem.name) {
      return json(res, 400, { error: 'Wishlist item name is required.' });
    }

    const { wishlist } = await getCollections();

    await wishlist.insertOne({
      ...nextItem,
      userId: DEMO_USER_ID,
      dateAdded: new Date(),
    });

    return json(res, 200, { items: await listItems() });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {};

    if (!id) {
      return json(res, 400, { error: 'Missing wishlist item id.' });
    }

    const { wishlist } = await getCollections();
    await wishlist.deleteOne({ _id: new ObjectId(id), userId: DEMO_USER_ID });
    return json(res, 200, { items: await listItems() });
  }

  return methodNotAllowed(res, ['GET', 'POST', 'DELETE']);
}
