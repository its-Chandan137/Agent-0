import { MongoClient } from 'mongodb';

let cachedClientPromise;

function getMongoClient() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  if (!cachedClientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      tls: true,
      tlsAllowInvalidCertificates: true,
    });
    cachedClientPromise = client.connect();
  }

  return cachedClientPromise;
}

export async function getDb() {
  const client = await getMongoClient();
  return client.db('budget_assistant');
}

export async function getCollections() {
  const db = await getDb();

  return {
    profiles: db.collection('profiles'),
    wishlist: db.collection('wishlist'),
    chats: db.collection('chats'),
  };
}

export function serializeDocument(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => serializeDocument(entry));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((result, [key, entry]) => {
      if (entry && typeof entry === 'object' && typeof entry.toHexString === 'function') {
        result[key] = entry.toHexString();
      } else {
        result[key] = serializeDocument(entry);
      }

      return result;
    }, {});
  }

  return value;
}