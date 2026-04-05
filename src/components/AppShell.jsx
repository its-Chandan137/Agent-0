import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

function AppShell({
  theme,
  setTheme,
  chats,
  activeChatId,
  onSelectChat,
  onStartNewChat,
  onToggleChatStar,
  onRenameChat,
  onDeleteChat,
  isBootstrapping,
  children,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  function handleSelectChat(chatId) {
    onSelectChat(chatId);
    setIsMobileSidebarOpen(false);

    if (location.pathname !== '/') {
      navigate('/');
    }
  }

  function handleStartNewChatClick() {
    onStartNewChat();
    setIsMobileSidebarOpen(false);

    if (location.pathname !== '/') {
      navigate('/');
    }
  }

  return (
    <div className="app-shell">
      <button
        type="button"
        className={`mobile-sidebar-toggle ${isMobileSidebarOpen ? 'is-hidden' : ''}`}
        aria-label={isMobileSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        aria-expanded={isMobileSidebarOpen}
        onClick={() => setIsMobileSidebarOpen((isOpen) => !isOpen)}
      >
        <span />
        <span />
        <span />
      </button>

      <button
        type="button"
        className={`sidebar-overlay ${isMobileSidebarOpen ? 'visible' : ''}`}
        aria-label="Close sidebar overlay"
        onClick={() => setIsMobileSidebarOpen(false)}
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
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />
      <main className="app-main">{children}</main>
    </div>
  );
}

export default AppShell;
