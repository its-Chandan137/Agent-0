function AppTopbar({
  title,
  status,
  showCaret = false,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
}) {
  return (
    <header className="chat-topbar app-topbar">
      <div className="chat-topbar-leading">
        <button
          type="button"
          className={`mobile-sidebar-toggle ${isMobileSidebarOpen ? 'is-hidden' : ''}`}
          aria-label={isMobileSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={isMobileSidebarOpen}
          onClick={onToggleMobileSidebar}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="chat-topbar-title">
          <span>{title}</span>
          {showCaret ? <span className="chat-topbar-caret">v</span> : null}
        </div>
      </div>

      <div className="chat-topbar-status">{status}</div>
    </header>
  );
}

export default AppTopbar;
