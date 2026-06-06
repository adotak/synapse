// ============================================
// ServerSidebar Component
// ============================================
// Fetches the user's servers list from the backend.
// Renders server icons on the left, allows switching servers,
// and opens a modal to create or join a server.

import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';

export default function ServerSidebar({ activeServer, onServerSelect }) {
  const [servers, setServers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'join'
  const [serverName, setServerName] = useState('');
  const [serverIdToJoin, setServerIdToJoin] = useState('');
  const [error, setError] = useState('');

  // Fetch servers from API
  const fetchServers = async () => {
    try {
      const response = await api.get('/api/servers');
      // API returns: { data: [...] }
      setServers(response.data.data || []);
      
      // Auto-select the first server if none is currently selected
      if (!activeServer && response.data.data?.length > 0) {
        onServerSelect(response.data.data[0]);
      }
    } catch (err) {
      console.error('Error fetching servers:', err);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleCreateServer = async (e) => {
    e.preventDefault();
    setError('');

    if (!serverName.trim()) {
      setError('Server name is required.');
      return;
    }

    try {
      const response = await api.post('/api/servers', { name: serverName });
      const newServer = response.data.data;
      
      setServers((prev) => [newServer, ...prev]);
      onServerSelect(newServer);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create server.');
    }
  };

  const handleJoinServer = async (e) => {
    e.preventDefault();
    setError('');

    if (!serverIdToJoin.trim()) {
      setError('Server ID is required.');
      return;
    }

    try {
      const response = await api.post(`/api/servers/${serverIdToJoin.trim()}/join`);
      const joinedServer = response.data.data;

      setServers((prev) => [...prev, joinedServer]);
      onServerSelect(joinedServer);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join server. Check the ID.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setServerName('');
    setServerIdToJoin('');
    setError('');
  };

  return (
    <aside className="server-sidebar">
      {/* Home / Synapse Brand Icon */}
      <div className="server-icon-wrapper">
        <div className="server-icon active" style={{ background: 'var(--accent)' }}>
          ⚛️
        </div>
        <div className="server-tooltip">Synapse Home</div>
      </div>

      <div className="server-separator" />

      {/* Render Server Icons */}
      {servers.map((server) => {
        const initials = server.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 3)
          .toUpperCase();

        return (
          <div key={server._id} className="server-icon-wrapper">
            <button
              onClick={() => onServerSelect(server)}
              className={`server-icon ${activeServer?._id === server._id ? 'active' : ''}`}
            >
              {initials}
            </button>
            <div className="server-tooltip">{server.name}</div>
          </div>
        );
      })}

      <div className="server-separator" />

      {/* Add/Join Server Button */}
      <div className="server-icon-wrapper">
        <button
          onClick={() => {
            setModalMode('create');
            setIsModalOpen(true);
          }}
          className="add-server-btn"
        >
          +
        </button>
        <div className="server-tooltip">Create or Join Server</div>
      </div>

      {/* Create / Join Server Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {modalMode === 'create' ? 'Create a Server' : 'Join a Server'}
            </h2>
            <p className="modal-subtitle">
              {modalMode === 'create'
                ? 'Your server is where you and your friends hang out. Make yours and start talking!'
                : 'Enter a Server ID to join an existing server community.'}
            </p>

            {/* Modal tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setModalMode('create')}
                className="btn-confirm"
                style={{
                  background: modalMode === 'create' ? 'var(--accent)' : 'var(--bg-input)',
                  padding: '6px 12px',
                  fontSize: '13px',
                }}
              >
                Create Server
              </button>
              <button
                type="button"
                onClick={() => setModalMode('join')}
                className="btn-confirm"
                style={{
                  background: modalMode === 'join' ? 'var(--accent)' : 'var(--bg-input)',
                  padding: '6px 12px',
                  fontSize: '13px',
                }}
              >
                Join Server
              </button>
            </div>

            {error && <div className="auth-error">{error}</div>}

            {modalMode === 'create' ? (
              <form onSubmit={handleCreateServer}>
                <div className="form-group">
                  <label htmlFor="serverName">Server Name</label>
                  <input
                    id="serverName"
                    type="text"
                    placeholder="My Awesome Server"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={closeModal} className="btn-cancel">
                    Cancel
                  </button>
                  <button type="submit" className="btn-confirm">
                    Create
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleJoinServer}>
                <div className="form-group">
                  <label htmlFor="serverId">Server ID</label>
                  <input
                    id="serverId"
                    type="text"
                    placeholder="65e45a27f6d5a1b32d..."
                    value={serverIdToJoin}
                    onChange={(e) => setServerIdToJoin(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={closeModal} className="btn-cancel">
                    Cancel
                  </button>
                  <button type="submit" className="btn-confirm">
                    Join Server
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
