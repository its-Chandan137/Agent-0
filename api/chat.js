import Groq from 'groq-sdk';
import { ObjectId } from 'mongodb';
import { getUserIdFromRequest, isAuthError } from '../lib/auth.js';
import { getCollections, serializeDocument } from '../lib/mongodb.js';
import { buildSystemPrompt, makeChatTitle } from '../lib/budgetContext.js';
import { methodNotAllowed, parseJsonBody, writeNdjson } from '../lib/http.js';

const MODEL = 'llama-3.3-70b-versatile';

function createGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY environment variable.');
  }

  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

// Review this 

function parseChatObjectId(chatId) {
  if (!chatId) {
    return null;
  }

  if (!ObjectId.isValid(chatId)) {
    throw new Error('Invalid chat id.');
  }

  return new ObjectId(chatId);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const userId = await getUserIdFromRequest(req);
    const { chatId, message } = await parseJsonBody(req);

    if (!message || !String(message).trim()) {
      return writeNdjson(res, [{ type: 'error', message: 'Message content is required.' }], 400);
    }

    if (!process.env.MONGODB_URI) {
      return writeNdjson(
        res,
        [{ type: 'error', message: 'Missing MONGODB_URI environment variable.' }],
        500,
      );
    }

    const chatObjectId = parseChatObjectId(chatId);
    const { chats, profiles, wishlist } = await getCollections();
    const [profile, wishlistItems, existingChat] = await Promise.all([
      profiles.findOne({ userId }),
      wishlist.find({ userId }).sort({ dateAdded: -1 }).toArray(),
      chatObjectId ? chats.findOne({ _id: chatObjectId, userId }) : null,
    ]);

    const userMessage = {
      role: 'user',
      content: String(message).trim(),
      timestamp: new Date(),
    };
    const chatTitle = existingChat?.title || makeChatTitle(userMessage.content);
    const now = new Date();
    let resolvedChatObjectId = chatObjectId;

    if (existingChat) {
      await chats.updateOne(
        { _id: chatObjectId, userId },
        {
          $push: { messages: userMessage },
          $set: { updatedAt: now },
        },
      );
    } else {
      const insertResult = await chats.insertOne({
        userId,
        title: chatTitle,
        messages: [userMessage],
        createdAt: now,
        updatedAt: now,
      });
      resolvedChatObjectId = insertResult.insertedId;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(
      `${JSON.stringify({
        type: 'meta',
        chatId: resolvedChatObjectId.toString(),
        title: chatTitle,
        createdAt: existingChat?.createdAt || now,
        updatedAt: now,
      })}\n`,
    );

    // Reload the thread after saving the user's message so the model sees full context.
    const freshChat = await chats.findOne({ _id: resolvedChatObjectId, userId });
    const systemPrompt = buildSystemPrompt({
      profile,
      wishlistItems,
    });
    const groq = createGroqClient();

    const stream = await groq.chat.completions.create({
      model: MODEL,
      stream: true,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        ...((freshChat?.messages || []).map((entry) => ({
          role: entry.role,
          content: entry.content,
        })) || []),
      ],
    });

    let assistantReply = '';

    for await (const chunk of stream) {
      const nextContent = chunk.choices?.[0]?.delta?.content || '';

      if (!nextContent) {
        continue;
      }

      assistantReply += nextContent;
      res.write(`${JSON.stringify({ type: 'chunk', content: nextContent })}\n`);
    }

    const assistantMessage = {
      role: 'assistant',
      content: assistantReply,
      timestamp: new Date(),
    };

    await chats.updateOne(
      { _id: resolvedChatObjectId, userId },
      {
        $push: { messages: assistantMessage },
        $set: { updatedAt: new Date() },
      },
    );

    const savedChat = await chats.findOne({ _id: resolvedChatObjectId, userId });
    res.write(`${JSON.stringify({ type: 'done', chat: serializeDocument(savedChat) })}\n`);
    res.end();
  } catch (error) {
    console.error('Chat streaming failed', error);

    const statusCode = isAuthError(error) ? error.statusCode || 401 : 500;

    if (!res.headersSent) {
      res.statusCode = statusCode;
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    }

    res.write(
      `${JSON.stringify({
        type: 'error',
        message: error.message || 'Unable to stream chat response.',
      })}\n`,
    );
    res.end();
  }
}
