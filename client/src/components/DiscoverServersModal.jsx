import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';

export default function DiscoverServersModal({ onClose, onJoin }) {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    fetchDiscoverableServers();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const fetchDiscoverableServers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/servers/discover');
      setServers(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch discoverable servers', err);
      setError('Failed to load servers.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    try {
      setJoinLoading(true);
      setError('');
      const response = await api.post('/api/servers/joinByCode', { inviteCode });
      const joinedServer = response.data.data;
      onJoin(joinedServer);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join server by code.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleJoinClick = async (server) => {
    // If we click join on a card, we use its known inviteCode.
    // However, if we didn't populate it we could just call the ID join endpoint.
    // Wait, let's just use the ID join endpoint since we know the ID, 
    // or just the code if it's there. The user is allowed to join public discover servers.
    // Actually, all discover servers are public so we can just use the /:id/join endpoint or /joinByCode.
    // Let's use /joinByCode for consistency if inviteCode is available.
    try {
      setJoinLoading(true);
      setError('');
      
      let response;
      if (server.inviteCode) {
        response = await api.post('/api/servers/joinByCode', { inviteCode: server.inviteCode });
      } else {
        response = await api.post(`/api/servers/${server._id}/join`);
      }
      
      onJoin(response.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join server.');
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="modal discover-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn-close-modal" onClick={onClose} aria-label="Close modal">✕</button>
        
        <h2>Discover Servers</h2>
        <p className="modal-subtitle">Find your community and explore new spaces.</p>

        {/* Join by Code Section */}
        <div className="join-by-code-section">
          <h3>Have an Invite Code?</h3>
          <form onSubmit={handleJoinByCode} className="join-by-code-form">
            <input
              type="text"
              placeholder="e.g. A7B9Z2"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength="6"
            />
            <button type="submit" className="btn-confirm" disabled={joinLoading || !inviteCode}>
              {joinLoading ? 'Joining...' : 'Join'}
            </button>
          </form>
          {error && <div className="auth-error" style={{ marginTop: '8px' }}>{error}</div>}
        </div>

        <div className="divider"></div>

        {/* Discover List Section */}
        <h3>Public Servers</h3>
        <div className="discover-grid">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : servers.length === 0 ? (
            <div className="empty-state">No new servers to discover right now.</div>
          ) : (
            servers.map(server => (
              <div key={server._id} className="discover-card">
                <div className="discover-card-icon">
                  {server.icon ? (
                    <img src={server.icon} alt={server.name} />
                  ) : (
                    <span>{server.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="discover-card-info">
                  <h4>{server.name}</h4>
                  <p className="member-count">{server.members.length} member{server.members.length !== 1 && 's'}</p>
                </div>
                <button 
                  className="btn-join" 
                  onClick={() => handleJoinClick(server)}
                  disabled={joinLoading}
                >
                  Join
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
