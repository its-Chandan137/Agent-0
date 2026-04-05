async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = 'Request failed';

    try {
      const data = await response.json();
      message = data.error || message;
    } catch (error) {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return response.json();
}

export function fetchProfile() {
  return request('/api/profile');
}

export function saveProfile(profile) {
  return request('/api/profile', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export function fetchWishlist() {
  return request('/api/wishlist');
}

export function createWishlistItem(item) {
  return request('/api/wishlist', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export function deleteWishlistItem(itemId) {
  return request(`/api/wishlist?id=${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
  });
}

export function fetchChats() {
  return request('/api/chats');
}

export function updateChat(chatId, updates) {
  return request('/api/chats', {
    method: 'PATCH',
    body: JSON.stringify({
      id: chatId,
      ...updates,
    }),
  });
}

export function deleteChat(chatId) {
  return request(`/api/chats?id=${encodeURIComponent(chatId)}`, {
    method: 'DELETE',
  });
}

export async function streamChatReply(payload, { onEvent }) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    let message = 'Could not stream chat response.';

    try {
      const data = await response.json();
      message = data.error || message;
    } catch (error) {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    lines
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const event = JSON.parse(line);

        if (event.type === 'error') {
          throw new Error(event.message || 'Streaming failed.');
        }

        onEvent?.(event);
      });

    if (done) {
      break;
    }
  }

  if (buffer.trim()) {
    const event = JSON.parse(buffer.trim());

    if (event.type === 'error') {
      throw new Error(event.message || 'Streaming failed.');
    }

    onEvent?.(event);
  }
}
