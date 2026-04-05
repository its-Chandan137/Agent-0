import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAdminSessions,
  fetchAdminUsers,
  revokeAdminSession,
  updateAdminUser,
} from '../lib/api';

const ADMIN_STORAGE_KEY = 'mantra-admin-password';

function AdminPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState(() => sessionStorage.getItem(ADMIN_STORAGE_KEY) || '');
  const [draftPassword, setDraftPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(() => Boolean(sessionStorage.getItem(ADMIN_STORAGE_KEY)));
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const selectedUser = useMemo(
    () => users.find((user) => user._id === selectedUserId) || null,
    [selectedUserId, users],
  );

  useEffect(() => {
    if (!isUnlocked || !password) {
      return;
    }

    loadUsers(password);
  }, [isUnlocked, password]);

  useEffect(() => {
    if (!isUnlocked || !password || !selectedUserId || activeTab !== 'sessions') {
      return;
    }

    loadSessions(password, selectedUserId);
  }, [activeTab, isUnlocked, password, selectedUserId]);

  async function loadUsers(adminPassword) {
    try {
      setIsLoadingUsers(true);
      setStatus('');
      const response = await fetchAdminUsers(adminPassword);
      setUsers(response.users || []);
      setSelectedUserId((currentUserId) => currentUserId || response.users?.[0]?._id || null);
    } catch (error) {
      setStatus(error.message || 'Could not load users.');

      if (error.message === 'Unauthorized.') {
        sessionStorage.removeItem(ADMIN_STORAGE_KEY);
        setPassword('');
        setIsUnlocked(false);
      }
    } finally {
      setIsLoadingUsers(false);
    }
  }

  async function loadSessions(adminPassword, userId) {
    try {
      setIsLoadingSessions(true);
      setStatus('');
      const response = await fetchAdminSessions(adminPassword, userId);
      setSessions(response.sessions || []);
    } catch (error) {
      setStatus(error.message || 'Could not load sessions.');
    } finally {
      setIsLoadingSessions(false);
    }
  }

  async function handleUnlock(event) {
    event.preventDefault();
    sessionStorage.setItem(ADMIN_STORAGE_KEY, draftPassword);
    setPassword(draftPassword);
    setIsUnlocked(true);
    setDraftPassword('');
  }

  function handleAdminLogout() {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    setPassword('');
    setDraftPassword('');
    setIsUnlocked(false);
    setUsers([]);
    setSessions([]);
    setSelectedUserId(null);
    setStatus('');
    navigate('/login');
  }

  async function handleUserAction(userId, action) {
    try {
      setStatus('');
      await updateAdminUser(password, { userId, action });
      await loadUsers(password);
    } catch (error) {
      setStatus(error.message || 'Could not update user.');
    }
  }

  async function handleRevokeSession(sessionId) {
    try {
      setStatus('');
      await revokeAdminSession(password, sessionId);
      await Promise.all([
        loadUsers(password),
        selectedUserId ? loadSessions(password, selectedUserId) : Promise.resolve(),
      ]);
    } catch (error) {
      setStatus(error.message || 'Could not revoke session.');
    }
  }

  async function handleRevokeAll() {
    if (!sessions.length) {
      return;
    }

    try {
      setStatus('');
      await Promise.all(sessions.map((session) => revokeAdminSession(password, session._id)));
      await Promise.all([
        loadUsers(password),
        selectedUserId ? loadSessions(password, selectedUserId) : Promise.resolve(),
      ]);
    } catch (error) {
      setStatus(error.message || 'Could not revoke all sessions.');
    }
  }

  if (!isUnlocked) {
    return (
      <section className="page auth-page">
        <div className="auth-layout">
          <div className="auth-card panel">
            <p className="page-eyebrow">Admin</p>
            <h1>Enter admin password</h1>
            <p className="auth-copy">
              This password is stored in session storage only for the current browser tab.
            </p>

            <form className="auth-form" onSubmit={handleUnlock}>
              <label>
                Admin password
                <input
                  type="password"
                  value={draftPassword}
                  onChange={(event) => setDraftPassword(event.target.value)}
                  placeholder="Enter admin password"
                  required
                />
              </label>

              <button type="submit" className="primary-button">
                Unlock admin
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page admin-page">
      <div className="page-header">
        <div className="admin-header-row">
          <div>
            <p className="page-eyebrow">Admin</p>
            <h2>Access approvals and device sessions</h2>
          </div>
          <button
            type="button"
            className="ghost-button admin-logout-button"
            onClick={handleAdminLogout}
          >
            Logout admin
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={`ghost-button admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          type="button"
          className={`ghost-button admin-tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions
        </button>
      </div>

      {status ? <p className="form-status admin-status">{status}</p> : null}

      {activeTab === 'users' ? (
        <div className="panel admin-panel">
          {isLoadingUsers ? (
            <p className="form-status">Loading users...</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Devices</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.phone}</td>
                      <td>{user.status}</td>
                      <td>{user.sessionCount || 0}</td>
                      <td>{formatAdminDate(user.requestedAt)}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => {
                              setSelectedUserId(user._id);
                              setActiveTab('sessions');
                            }}
                          >
                            Sessions
                          </button>
                          {user.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                className="primary-button admin-inline-button"
                                onClick={() => handleUserAction(user._id, 'approve')}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="sidebar-delete-button admin-inline-button"
                                onClick={() => handleUserAction(user._id, 'block')}
                              >
                                Block
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="admin-sessions-grid">
          <div className="panel admin-users-list">
            <h3>Users</h3>
            <div className="admin-user-buttons">
              {users.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  className={`ghost-button admin-user-button ${
                    user._id === selectedUserId ? 'active' : ''
                  }`}
                  onClick={() => setSelectedUserId(user._id)}
                >
                  <span>{user.name}</span>
                  <span>{user.sessionCount || 0} devices</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel admin-panel">
            <div className="admin-session-header">
              <div>
                <h3>{selectedUser ? `${selectedUser.name}'s sessions` : 'Sessions'}</h3>
                <p className="form-status">
                  {selectedUser ? selectedUser.phone : 'Select a user to inspect active devices.'}
                </p>
              </div>
              <button
                type="button"
                className="sidebar-delete-button admin-inline-button"
                onClick={handleRevokeAll}
                disabled={!sessions.length}
              >
                Revoke All
              </button>
            </div>

            {isLoadingSessions ? (
              <p className="form-status">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <div className="empty-state compact">
                <h3>No active sessions</h3>
                <p>This user does not have any active device sessions right now.</p>
              </div>
            ) : (
              <div className="admin-session-list">
                {sessions.map((session) => (
                  <article key={session._id} className="wishlist-card admin-session-card">
                    <div>
                      <h3>{session.device || 'Unknown device'}</h3>
                      <p className="wishlist-date">IP: {session.ip || 'unknown'}</p>
                      <p className="wishlist-date">
                        Last active {formatAdminDate(session.lastActive)}
                      </p>
                      <p className="wishlist-date">
                        Created {formatAdminDate(session.createdAt)}
                      </p>
                    </div>
                    <div className="wishlist-card-side">
                      <button
                        type="button"
                        className="sidebar-delete-button admin-inline-button"
                        onClick={() => handleRevokeSession(session._id)}
                      >
                        Revoke
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function formatAdminDate(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default AdminPage;
