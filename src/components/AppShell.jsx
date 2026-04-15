import { useLocation, useNavigate } from 'react-router-dom';
import AppTopbar from './AppTopbar';
import Sidebar from './Sidebar';

function AppShell({
  theme,
  setTheme,
  currentUser,
  chats,
  activeChat,
  activeChatId,
  onSelectChat,
  onStartNewChat,
  onToggleChatStar,
  onRenameChat,
  onDeleteChat,
  isBootstrapping,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  onCloseMobileSidebar,
  onLogout,
  children,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const topbarMeta = getTopbarMeta(location.pathname, activeChat);

  function handleSelectChat(chatId) {
    onSelectChat(chatId);
    onCloseMobileSidebar();

    if (location.pathname !== '/') {
      navigate('/');
    }
  }

  function handleStartNewChatClick() {
    onStartNewChat();
    onCloseMobileSidebar();

    if (location.pathname !== '/') {
      navigate('/');
    }
  }

  return (
    <div className="app-shell">
      <button
        type="button"
        className={`sidebar-overlay ${isMobileSidebarOpen ? 'visible' : ''}`}
        aria-label="Close sidebar overlay"
        onClick={onCloseMobileSidebar}
      />

      <Sidebar
        theme={theme}
        setTheme={setTheme}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onStartNewChat={handleStartNewChatClick}
        onToggleChatStar={onToggleChatStar}
        onRenameChat={onRenameChat}
        onDeleteChat={onDeleteChat}
        isBootstrapping={isBootstrapping}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobileSidebar={onCloseMobileSidebar}
      />
      <main className="app-main">
        <AppTopbar
          theme={theme}
          title={topbarMeta.title}
          status={topbarMeta.status}
          showCaret={topbarMeta.showCaret}
          currentUser={currentUser}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onToggleMobileSidebar={onToggleMobileSidebar}
          onLogout={onLogout}
        />
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}

function getTopbarMeta(pathname, activeChat) {
  if (pathname === '/profile') {
    return {
      title: 'Budget profile',
      status: 'Income, expenses, and savings goals',
      showCaret: false,
    };
  }

  if (pathname === '/wishlist') {
    return {
      title: 'Wishlist',
      status: 'Planned purchases and priorities',
      showCaret: false,
    };
  }

  return {
    title: 'Mantra',
    status: activeChat?.messages?.length ? activeChat.title || 'Budget chat' : 'Budget Assistant',
    showCaret: true,
  };
}

export default AppShell;
