// ============================================
// ChannelSidebar Component
// ============================================
// Second column (240px) — shows the list of text channels
// for the currently selected server. Includes:
// - Server name header
// - Channel list with # prefix and active state
// - "Create Channel" button (owner only)
// - Create channel modal
// - User panel at bottom with logout

import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';

export default function ChannelSidebar({ activeServer, activeChannel, onChannelSelect }) {
  const { user, logout } = useAuth();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [error, setError] = useState('');

  // Fetch channels whenever the active server changes
  useEffect(() => {
    if (!activeServer) {
      setChannels([]);
      return;
    }

    const fetchChannels = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/channels?server=${activeServer._id}`);
        const fetchedChannels = response.data.data || [];
        setChannels(fetchedChannels);

        // Auto-select the first channel if none is currently selected
        if (fetchedChannels.length > 0 && !activeChannel) {
          onChannelSelect(fetchedChannels[0]);
        }
      } catch (err) {
        console.error('Error fetching channels:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [activeServer?._id]);

  // Check if the current user is the server owner (can create channels)
  const isOwner = activeServer?.owner?._id === user?.id || activeServer?.owner === user?.id;

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    setError('');

    if (!channelName.trim()) {
      setError('Channel name is required.');
      return;
    }

    try {
      const response = await api.post('/api/channels', {
        name: channelName,
        serverId: activeServer._id,
      });

      const newChannel = response.data.data;
      setChannels((prev) => [...prev, newChannel]);
      onChannelSelect(newChannel);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create channel.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setChannelName('');
    setError('');
  };

  const handleLogout = () => {
    logout();
  };

  // If no server is selected, show an empty state
  if (!activeServer) {
    return (
      <aside className="channel-sidebar">
        <div className="channel-header">Synapse</div>
        <div className="empty-state">
          <div className="empty-state-icon">🧠</div>
          <h3>Welcome to Synapse</h3>
          <p>Select or create a server to get started</p>
        </div>
        {user && (
          <div className="user-panel">
            <div className="user-panel-avatar">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-panel-info">
              <div className="user-panel-name">{user.username}</div>
              <div className="user-panel-status">Online</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Log Out">
              ⏻
            </button>
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside className="channel-sidebar">
      {/* Server Name Header */}
      <div className="channel-header">
        {activeServer.name}
      </div>

      {/* Channel Category Header */}
      <div className="channel-category">
        <span className="channel-category-name">Text Channels</span>
        {isOwner && (
          <button
            className="channel-category-add"
            onClick={() => setIsModalOpen(true)}
            title="Create Channel"
          >
            +
          </button>
        )}
      </div>

      {/* Channel List */}
      <div className="channel-list">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        ) : channels.length === 0 ? (
          <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
            No channels yet. {isOwner ? 'Create one!' : 'Ask the admin to create one.'}
          </div>
        ) : (
          channels.map((channel) => (
            <button
              key={channel._id}
              className={`channel-item ${activeChannel?._id === channel._id ? 'active' : ''}`}
              onClick={() => onChannelSelect(channel)}
            >
              <span className="channel-hash">#</span>
              {channel.name}
            </button>
          ))
        )}
      </div>

      {/* User Panel (Bottom) */}
      {user && (
        <div className="user-panel">
          <div className="user-panel-avatar">
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <div className="user-panel-info">
            <div className="user-panel-name">{user.username}</div>
            <div className="user-panel-status">Online</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Log Out">
            ⏻
          </button>
        </div>
      )}

      {/* Create Channel Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Channel</h2>
            <p className="modal-subtitle">
              Add a new text channel to {activeServer.name}
            </p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleCreateChannel}>
              <div className="form-group">
                <label htmlFor="channelName">Channel Name</label>
                <input
                  id="channelName"
                  type="text"
                  placeholder="new-channel"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-confirm">
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
