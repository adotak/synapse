import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';

export default function ServerSettingsModal({ server, onClose }) {
  const [copied, setCopied] = useState(false);
  const [channelCount, setChannelCount] = useState(0);

  useEffect(() => {
    // Fetch channels to get the total count for this server
    const fetchChannelsCount = async () => {
      try {
        const response = await api.get(`/api/channels?server=${server._id}`);
        if (response.data && response.data.data) {
          setChannelCount(response.data.data.length);
        }
      } catch (err) {
        console.error('Failed to fetch channel count:', err);
      }
    };
    fetchChannelsCount();
  }, [server._id]);

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

  const handleCopyCode = () => {
    if (server.inviteCode) {
      navigator.clipboard.writeText(server.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1500 }}>
      <div className="modal server-settings-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn-close-modal" onClick={onClose} aria-label="Close modal">✕</button>
        
        <h2>Server Overview</h2>
        <p className="modal-subtitle">Details and invite links for {server.name}</p>

        <div className="server-settings-content">
          <div className="server-settings-icon">
            {server.icon ? (
              <img src={server.icon} alt={server.name} />
            ) : (
              <div className="server-icon-placeholder large">
                {server.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="server-settings-details">
            <div className="form-group">
              <label>Server Name</label>
              <input type="text" value={server.name} disabled className="disabled-input" />
            </div>

            <div className="form-group">
              <label>Owner</label>
              <input 
                type="text" 
                value={server.owner?.username || 'Unknown'} 
                disabled 
                className="disabled-input" 
              />
            </div>

            <div className="form-group invite-code-group">
              <label>Invite Code</label>
              <p className="field-description">Share this code with friends so they can easily join your server!</p>
              
              {server.inviteCode ? (
                <div className="invite-code-box">
                  <span className="invite-code-text">{server.inviteCode}</span>
                  <button className="btn-copy" onClick={handleCopyCode}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ) : (
                <div className="invite-code-box missing">
                  <span className="invite-code-text">No code available</span>
                </div>
              )}
            </div>
            
            <div className="server-stats">
              <div className="stat">
                <span className="stat-value">{server.members?.length || 0}</span>
                <span className="stat-label">Members</span>
              </div>
              <div className="stat">
                <span className="stat-value">{channelCount}</span>
                <span className="stat-label">Channels</span>
              </div>
              <div className="stat">
                <span className="stat-value">{new Date(server.createdAt).toLocaleDateString()}</span>
                <span className="stat-label">Created</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
