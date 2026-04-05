import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

function AppShell({
  theme,
  setTheme,
  chats,
  activeChatId,
  onSelectChat,
  onStartNewChat,
  isBootstrapping,
  children,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleSelectChat(chatId) {
    onSelectChat(chatId);

    if (location.pathname !== '/') {
      navigate('/');
    }
  }

  function handleStartNewChatClick() {
    onStartNewChat();

    if (location.pathname !== '/') {
      navigate('/');
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        theme={theme}
        setTheme={setTheme}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onStartNewChat={handleStartNewChatClick}
        isBootstrapping={isBootstrapping}
      />
      <main className="app-main">{children}</main>
    </div>
  );
}

export default AppShell;
