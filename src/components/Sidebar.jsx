import { useEffect, useState } from 'react';
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
      <path
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5v6A1.5 1.5 0 0 1 14.5 13H8l-4 3v-3.5A1.5 1.5 0 0 1 2.5 11v-5.5A1.5 1.5 0 0 1 4 4"
        fill="none"
      />
    </svg>
  );
}

function HistoryActionIcon({ icon }) {
  if (icon === 'star') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="m10 3.5 1.9 3.8 4.2.6-3.1 3 0.7 4.2-3.7-2-3.7 2 0.7-4.2-3.1-3 4.2-.6Z" />
      </svg>
    );
  }

  if (icon === 'rename') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="m13.8 3.6 2.6 2.6-8.2 8.2-3.2.6.6-3.2Z" />
        <path d="M11.8 5.6 14.4 8.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4.5 6h11" />
      <path d="M7.5 6V4.5h5V6" />
      <path d="M6.5 8.5v6.5" />
      <path d="M10 8.5v6.5" />
      <path d="M13.5 8.5v6.5" />
      <path d="M5.5 6l.8 10h7.4l.8-10" />
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
  onToggleChatStar,
  onRenameChat,
  onDeleteChat,
  isBootstrapping,
}) {
  const { isScrolling: isHistoryScrolling, handleScroll: handleHistoryScroll } = useScrollActivity();
  const [menuChatId, setMenuChatId] = useState(null);
  const [renameChatId, setRenameChatId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteChatId, setDeleteChatId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSavingRename, setIsSavingRename] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);

  const menuChat = chats.find((chat) => chat._id === menuChatId) || null;
  const renameChat = chats.find((chat) => chat._id === renameChatId) || null;
  const deleteChatTarget = chats.find((chat) => chat._id === deleteChatId) || null;

  useEffect(() => {
    function handleWindowClick() {
      setMenuChatId(null);
    }

    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  useEffect(() => {
    if (renameChatId && !renameChat) {
      setRenameChatId(null);
      setRenameValue('');
    }

    if (deleteChatId && !deleteChatTarget) {
      setDeleteChatId(null);
    }

    if (menuChatId && !menuChat) {
      setMenuChatId(null);
    }
  }, [deleteChatId, deleteChatTarget, menuChat, menuChatId, renameChat, renameChatId]);

  function closeRenameDialog() {
    setRenameChatId(null);
    setRenameValue('');
  }

  function closeDeleteDialog() {
    setDeleteChatId(null);
  }

  async function handleStarToggle(chat) {
    setStatusMessage('');
    const result = await onToggleChatStar(chat._id);

    if (!result.success) {
      setStatusMessage(result.message || 'Could not update favorite status.');
    }

    setMenuChatId(null);
  }

  function handleOpenRename(chat) {
    setStatusMessage('');
    setMenuChatId(null);
    setRenameChatId(chat._id);
    setRenameValue(chat.title || '');
  }

  async function handleRenameSubmit(event) {
    event.preventDefault();

    if (!renameChat) {
      return;
    }

    setIsSavingRename(true);
    const result = await onRenameChat(renameChat._id, renameValue);
    setIsSavingRename(false);

    if (result.success) {
      closeRenameDialog();
      return;
    }

    setStatusMessage(result.message || 'Could not rename this chat.');
  }

  function handleOpenDelete(chat) {
    setStatusMessage('');
    setMenuChatId(null);
    setDeleteChatId(chat._id);
  }

  async function handleDeleteConfirm() {
    if (!deleteChatTarget) {
      return;
    }

    setIsDeletingChat(true);
    const result = await onDeleteChat(deleteChatTarget._id);
    setIsDeletingChat(false);

    if (result.success) {
      closeDeleteDialog();
      return;
    }

    setStatusMessage(result.message || 'Could not delete this chat.');
  }

  return (
    <>
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
                  <article
                    key={chat._id}
                    className={`history-card ${chat._id === activeChatId ? 'active' : ''}`}
                  >
                    <button
                      type="button"
                      className="history-item"
                      onClick={() => onSelectChat(chat._id)}
                    >
                      <span className="history-item-main">
                        {chat.starred ? (
                          <span className="history-star-badge" aria-hidden="true">
                            &#9733;
                          </span>
                        ) : null}
                        <span className="history-item-title">{chat.title || 'Untitled chat'}</span>
                      </span>
                      <span className="history-item-meta">{formatRelativeTime(chat.updatedAt)}</span>
                    </button>

                    <div className="history-item-actions">
                      <button
                        type="button"
                        className="history-action-trigger"
                        aria-label="Open chat actions"
                        onClick={(event) => {
                          event.stopPropagation();
                          setMenuChatId((currentId) => (currentId === chat._id ? null : chat._id));
                        }}
                      >
                        ...
                      </button>

                      {menuChatId === chat._id ? (
                        <div className="history-action-menu" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            className="history-action-menu-item"
                            onClick={() => handleStarToggle(chat)}
                          >
                            <HistoryActionIcon icon="star" />
                            <span>{chat.starred ? 'Unstar' : 'Star'}</span>
                          </button>
                          <button
                            type="button"
                            className="history-action-menu-item"
                            onClick={() => handleOpenRename(chat)}
                          >
                            <HistoryActionIcon icon="rename" />
                            <span>Rename</span>
                          </button>
                          <div className="history-action-divider" />
                          <button
                            type="button"
                            className="history-action-menu-item delete"
                            onClick={() => handleOpenDelete(chat)}
                          >
                            <HistoryActionIcon icon="delete" />
                            <span>Delete</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        {statusMessage ? <p className="sidebar-status">{statusMessage}</p> : null}

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

      {renameChat ? (
        <div className="sidebar-modal-backdrop" onClick={closeRenameDialog}>
          <div className="sidebar-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Rename chat</h3>
            <p className="sidebar-modal-copy">Choose a clearer title for this conversation.</p>
            <form className="sidebar-modal-form" onSubmit={handleRenameSubmit}>
              <input
                type="text"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                placeholder="Enter chat title"
                autoFocus
              />
              <div className="sidebar-modal-actions">
                <button
                  type="button"
                  className="ghost-button sidebar-modal-button"
                  onClick={closeRenameDialog}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button sidebar-modal-button"
                  disabled={isSavingRename || !renameValue.trim()}
                >
                  {isSavingRename ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteChatTarget ? (
        <div className="sidebar-modal-backdrop" onClick={closeDeleteDialog}>
          <div className="sidebar-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Delete chat?</h3>
            <p className="sidebar-modal-copy">
              This will permanently remove "{deleteChatTarget.title || 'Untitled chat'}".
            </p>
            <div className="sidebar-modal-actions">
              <button
                type="button"
                className="ghost-button sidebar-modal-button"
                onClick={closeDeleteDialog}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sidebar-delete-button sidebar-modal-button"
                onClick={handleDeleteConfirm}
                disabled={isDeletingChat}
              >
                {isDeletingChat ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default Sidebar;
