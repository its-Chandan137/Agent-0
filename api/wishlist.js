import { ObjectId } from 'mongodb';
import { getUserIdFromRequest, isAuthError } from '../lib/auth.js';
import { getCollections, serializeDocument } from '../lib/mongodb.js';
import { json, methodNotAllowed, parseJsonBody } from '../lib/http.js';
import { normalizeWishlistItem } from '../lib/budgetContext.js';

async function listItems(userId) {
  const { wishlist } = await getCollections();
  const items = await wishlist.find({ userId }).sort({ dateAdded: -1 }).toArray();
  return items.map((item) => serializeDocument(item));
}

export default async function handler(req, res) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (req.method === 'GET') {
      return json(res, 200, { items: await listItems(userId) });
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
        userId,
        dateAdded: new Date(),
      });

      return json(res, 200, { items: await listItems(userId) });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query || {};

      if (!id) {
        return json(res, 400, { error: 'Missing wishlist item id.' });
      }

      const { wishlist } = await getCollections();
      await wishlist.deleteOne({ _id: new ObjectId(id), userId });
      return json(res, 200, { items: await listItems(userId) });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'DELETE']);
  } catch (error) {
    if (isAuthError(error)) {
      return json(res, error.statusCode || 401, { error: error.message });
    }

    console.error('Wishlist route failed', error);
    return json(res, 500, { error: 'Could not process wishlist request.' });
  }
}
