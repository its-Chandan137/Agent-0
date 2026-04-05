import { NavLink } from 'react-router-dom';
import { formatRelativeTime } from '../lib/format';
import { useScrollActivity } from '../lib/useScrollActivity';

const navItems = [
  { to: '/', label: 'Chats', icon: 'chat' },
  { to: '/profile', label: 'Budget profile', icon: 'profile' },
  { to: '/wishlist', label: 'Wishlist', icon: 'wishlist' },
];

function SidebarIcon({ icon }) {
  if (icon === 'profile') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="6.5" r="3.25" />
        <path d="M4.5 16c.7-2.8 2.8-4.2 5.5-4.2s4.8 1.4 5.5 4.2" fill="none" />
      </svg>
    );
  }

  if (icon === 'wishlist') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 16.2 4.6 11a3.4 3.4 0 0 1 4.8-4.8L10 6.8l.6-.6a3.4 3.4 0 0 1 4.8 4.8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5v6A1.5 1.5 0 0 1 14.5 13H8l-4 3v-3.5A1.5 1.5 0 0 1 2.5 11v-5.5A1.5 1.5 0 0 1 4 4" fill="none" />
    </svg>
  );
}

function Sidebar({
  theme,
  setTheme,
  chats,
  activeChatId,
  onSelectChat,
  onStartNewChat,
  isBootstrapping,
}) {
  const { isScrolling: isHistoryScrolling, handleScroll: handleHistoryScroll } = useScrollActivity();

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">AI</div>
          <div className="sidebar-brand-copy">
            <span className="sidebar-brand-title">BudgetGPT</span>
            <span className="sidebar-brand-subtitle">Personal money copilot</span>
          </div>
        </div>
      </div>

      <button type="button" className="new-chat-button" onClick={onStartNewChat}>
        + New chat
      </button>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-link-icon">
              <SidebarIcon icon={item.icon} />
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="history-panel">
        <div className="history-header">
          <span>Recent</span>
          <span>{chats.length}</span>
        </div>

        <div
          onScroll={handleHistoryScroll}
          className={`history-scroll-area ${isHistoryScrolling ? 'is-scrolling' : ''}`}
        >
          {isBootstrapping ? (
            <div className="history-skeleton-list" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="history-skeleton-item">
                  <span className="history-skeleton-line history-skeleton-line-title" />
                  <span className="history-skeleton-line history-skeleton-line-meta" />
                </div>
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="history-empty">Your saved chats will appear here.</div>
          ) : (
            <div className="history-list">
              {chats.map((chat) => (
                <button
                  key={chat._id}
                  type="button"
                  className={`history-item ${chat._id === activeChatId ? 'active' : ''}`}
                  onClick={() => onSelectChat(chat._id)}
                >
                  <span className="history-item-title">{chat.title || 'Untitled chat'}</span>
                  <span className="history-item-meta">{formatRelativeTime(chat.updatedAt)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
