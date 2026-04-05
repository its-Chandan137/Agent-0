export function makeClientId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function makeChatTitle(input) {
  const cleanTitle = input.trim().replace(/\s+/g, ' ');
  return cleanTitle.length > 42 ? `${cleanTitle.slice(0, 42)}...` : cleanTitle || 'New chat';
}

export function formatChatCollection(chats) {
  return chats.map((chat) => ({
    ...chat,
    messages: (chat.messages || []).map((message, index) => ({
      ...message,
      clientId:
        message.clientId ||
        `${chat._id}-${message.role}-${message.timestamp || 'message'}-${index}`,
    })),
  }));
}

export function mergeStreamChunk(messages, assistantClientId, nextChunk) {
  return messages.map((message) =>
    message.clientId === assistantClientId
      ? {
          ...message,
          isStreaming: true,
          content: `${message.content || ''}${nextChunk}`,
        }
      : message,
  );
}

export function reconcileChatIdentity(chat, currentId, nextFields) {
  if (chat._id !== currentId) {
    return chat;
  }

  return {
    ...chat,
    ...nextFields,
  };
}
