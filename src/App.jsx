import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from './components/AppShell';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';
import {
  createWishlistItem,
  deleteChat,
  deleteWishlistItem,
  fetchChats,
  fetchProfile,
  fetchWishlist,
  saveProfile,
  streamChatReply,
  updateChat,
} from './lib/api';
import {
  formatChatCollection,
  makeChatTitle,
  makeClientId,
  mergeStreamChunk,
  reconcileChatIdentity,
} from './lib/chat';

const defaultProfile = {
  income: '',
  fixedExpenses: '',
  savingsGoal: '',
};

function App() {
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('budget-theme') || 'dark');
  const [profile, setProfile] = useState(defaultProfile);
  const [wishlist, setWishlist] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [creatingWishlistItem, setCreatingWishlistItem] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('budget-theme', theme);
  }, [theme]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  async function loadInitialData() {
    try {
      setIsBootstrapping(true);
      const [profileData, wishlistData, chatData] = await Promise.all([
        fetchProfile(),
        fetchWishlist(),
        fetchChats(),
      ]);

      const formattedChats = formatChatCollection(chatData.chats || []);

      setProfile({
        income: profileData.profile?.income ?? '',
        fixedExpenses: profileData.profile?.fixedExpenses ?? '',
        savingsGoal: profileData.profile?.savingsGoal ?? '',
      });
      setWishlist(wishlistData.items || []);
      setChats(formattedChats);
      setActiveChatId((currentActiveId) => currentActiveId || formattedChats[0]?._id || null);
    } catch (error) {
      console.error('Failed to bootstrap app', error);
    } finally {
      setIsBootstrapping(false);
    }
  }

  async function refreshChats(preferredChatId = null) {
    try {
      const chatData = await fetchChats();
      const formattedChats = formatChatCollection(chatData.chats || []);
      setChats(formattedChats);

      setActiveChatId((currentActiveId) => {
        if (preferredChatId && formattedChats.some((chat) => chat._id === preferredChatId)) {
          return preferredChatId;
        }

        if (currentActiveId && formattedChats.some((chat) => chat._id === currentActiveId)) {
          return currentActiveId;
        }

        return formattedChats[0]?._id || null;
      });
    } catch (error) {
      console.error('Failed to refresh chats', error);
    }
  }

  const activeChat = useMemo(
    () => chats.find((chat) => chat._id === activeChatId) || null,
    [activeChatId, chats],
  );

  async function handleSaveProfile(formValues) {
    setSavingProfile(true);

    try {
      const response = await saveProfile(formValues);
      setProfile({
        income: response.profile?.income ?? '',
        fixedExpenses: response.profile?.fixedExpenses ?? '',
        savingsGoal: response.profile?.savingsGoal ?? '',
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleCreateWishlistItem(formValues) {
    setCreatingWishlistItem(true);

    try {
      const response = await createWishlistItem(formValues);
      setWishlist(response.items || []);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setCreatingWishlistItem(false);
    }
  }

  async function handleDeleteWishlistItem(itemId) {
    try {
      const response = await deleteWishlistItem(itemId);
      setWishlist(response.items || []);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  function handleStartNewChat() {
    setActiveChatId(null);
  }

  async function handleToggleChatStar(chatId) {
    const targetChat = chats.find((chat) => chat._id === chatId);

    if (!targetChat) {
      return { success: false, message: 'Chat not found.' };
    }

    try {
      const response = await updateChat(chatId, { starred: !targetChat.starred });
      const [updatedChat] = formatChatCollection([response.chat]);

      setChats((currentChats) =>
        currentChats
          .map((chat) => (chat._id === chatId ? updatedChat : chat))
          .sort((left, right) => {
            if (Boolean(right.starred) !== Boolean(left.starred)) {
              return Number(Boolean(right.starred)) - Number(Boolean(left.starred));
            }

            return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
          }),
      );

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async function handleRenameChat(chatId, title) {
    try {
      const response = await updateChat(chatId, { title });
      const [updatedChat] = formatChatCollection([response.chat]);

      setChats((currentChats) =>
        currentChats.map((chat) => (chat._id === chatId ? updatedChat : chat)),
      );

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async function handleDeleteChat(chatId) {
    try {
      await deleteChat(chatId);
      await refreshChats(chatId === activeChatId ? null : activeChatId);

      setChats((currentChats) => currentChats.filter((chat) => chat._id !== chatId));
      setActiveChatId((currentActiveId) => (currentActiveId === chatId ? null : currentActiveId));

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async function handleSendMessage(content) {
    if (!content.trim() || isStreaming) {
      return;
    }

    const userMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      clientId: makeClientId('user'),
    };
    const assistantClientId = makeClientId('assistant');
    const assistantPlaceholder = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
      clientId: assistantClientId,
    };
    const tempChatId = activeChat?._id || `draft-${Date.now()}`;
    const isNewChat = !activeChat;
    const optimisticChat = isNewChat
      ? {
          _id: tempChatId,
          title: makeChatTitle(content),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [userMessage, assistantPlaceholder],
        }
      : {
          ...activeChat,
          updatedAt: new Date().toISOString(),
          messages: [...activeChat.messages, userMessage, assistantPlaceholder],
        };

    setIsStreaming(true);
    setActiveChatId(tempChatId);
    setChats((currentChats) => {
      if (isNewChat) {
        return [optimisticChat, ...currentChats];
      }

      return currentChats.map((chat) => (chat._id === activeChat._id ? optimisticChat : chat));
    });

    let persistedChatId = activeChat?._id || null;

    try {
      await streamChatReply(
        { chatId: activeChat?._id || null, message: content.trim() },
        {
          onEvent: (event) => {
            if (event.type === 'meta') {
              persistedChatId = event.chatId;
              setActiveChatId(event.chatId);
              setChats((currentChats) =>
                currentChats.map((chat) =>
                  reconcileChatIdentity(chat, tempChatId, {
                    _id: event.chatId,
                    title: event.title || chat.title,
                    createdAt: event.createdAt || chat.createdAt,
                    updatedAt: event.updatedAt || chat.updatedAt,
                  }),
                ),
              );
            }

            if (event.type === 'chunk') {
              setChats((currentChats) =>
                currentChats.map((chat) => {
                  if (chat._id !== (persistedChatId || tempChatId)) {
                    return chat;
                  }

                  return {
                    ...chat,
                    messages: mergeStreamChunk(chat.messages, assistantClientId, event.content || ''),
                  };
                }),
              );
            }

            if (event.type === 'done' && event.chat) {
              const [serverChat] = formatChatCollection([event.chat]);

              setChats((currentChats) => {
                const existingIndex = currentChats.findIndex(
                  (chat) => chat._id === serverChat._id || chat._id === tempChatId,
                );

                if (existingIndex === -1) {
                  return [serverChat, ...currentChats];
                }

                return currentChats.map((chat, index) => (index === existingIndex ? serverChat : chat));
              });
            }
          },
        },
      );

      if (isNewChat) {
        await refreshChats(persistedChatId || tempChatId);
      }
    } catch (error) {
      setChats((currentChats) =>
        currentChats.map((chat) => {
          if (chat._id !== (persistedChatId || tempChatId)) {
            return chat;
          }

          return {
            ...chat,
            messages: chat.messages.map((message) =>
              message.clientId === assistantClientId
                ? {
                    ...message,
                    isStreaming: false,
                    content:
                      'I hit a snag while streaming that answer. Please try again in a moment.',
                  }
                : message,
            ),
          };
        }),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <AppShell
      theme={theme}
      setTheme={setTheme}
      chats={chats}
      activeChat={activeChat}
      activeChatId={activeChatId}
      onSelectChat={setActiveChatId}
      onStartNewChat={handleStartNewChat}
      onToggleChatStar={handleToggleChatStar}
      onRenameChat={handleRenameChat}
      onDeleteChat={handleDeleteChat}
      isBootstrapping={isBootstrapping}
      isMobileSidebarOpen={isMobileSidebarOpen}
      onToggleMobileSidebar={() => setIsMobileSidebarOpen((isOpen) => !isOpen)}
      onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
    >
      <Routes>
        <Route
          path="/"
          element={
            <ChatPage
              activeChat={activeChat}
              isStreaming={isStreaming}
              onSendMessage={handleSendMessage}
            />
          }
        />
        <Route
          path="/profile"
          element={
            <ProfilePage
              profile={profile}
              isSaving={savingProfile}
              onSave={handleSaveProfile}
            />
          }
        />
        <Route
          path="/wishlist"
          element={
            <WishlistPage
              wishlist={wishlist}
              profile={profile}
              isCreating={creatingWishlistItem}
              onCreate={handleCreateWishlistItem}
              onDelete={handleDeleteWishlistItem}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default App;
