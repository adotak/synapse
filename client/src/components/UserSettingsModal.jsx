import React, { useState, useEffect, useRef } from 'react';
import { api, useAuth } from '../context/AuthContext';

export default function UserSettingsModal({ onClose }) {
  const { user, updateUser } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    nickname: user?.nickname || '',
    bio: user?.bio || '',
    pronouns: user?.pronouns || '',
    portfolioLink: user?.portfolioLink || '',
    accentColor: user?.accentColor || '#5865F2',
    avatar: user?.avatar || '',
    bannerUrl: user?.bannerUrl || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Refs for file inputs
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`Image must be less than 5MB`);
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      setLoading(true);
      setError('');
      const response = await api.post('/api/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const fileUrl = `http://localhost:5000${response.data.data.fileUrl}`;
      setFormData(prev => ({ ...prev, [fieldName]: fileUrl }));
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/api/users/profile', formData);
      const updatedUser = response.data.data;
      
      // Update global context & local storage
      updateUser(updatedUser);
      setSuccess('Profile updated successfully!');
      
      // Auto-close after a short delay on success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const displayName = formData.nickname || user.username;

  return (
    <div className="modal-overlay user-settings-overlay" onClick={onClose}>
      <div className="modal user-settings-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn-close-modal" onClick={onClose} aria-label="Close modal">✕</button>
        
        <div className="user-settings-content">
          {/* Left Column: Form Settings */}
          <div className="user-settings-form-section">
            <h2>User Profile</h2>
            <p className="modal-subtitle">Customize how you appear to others across Synapse.</p>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <form onSubmit={handleSubmit} className="settings-form">
              <div className="account-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                <div className="stat">
                  <span className="stat-label">User ID</span>
                  <span className="stat-value" style={{ fontSize: '14px', fontFamily: 'monospace' }}>{user.id || user._id}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Member Since</span>
                  <span className="stat-value" style={{ fontSize: '14px' }}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Just now'}
                  </span>
                </div>
              </div>

              <div className="form-group row">
                <div className="form-group-half">
                  <label htmlFor="nickname">Display Name</label>
                  <input
                    type="text"
                    id="nickname"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    placeholder={user.username}
                    maxLength="32"
                  />
                </div>
                <div className="form-group-half">
                  <label htmlFor="pronouns">Pronouns</label>
                  <input
                    type="text"
                    id="pronouns"
                    name="pronouns"
                    value={formData.pronouns}
                    onChange={handleChange}
                    placeholder="they/them"
                    maxLength="30"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bio">About Me</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Share a little bit about your art and interests..."
                  maxLength="500"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="portfolioLink">Portfolio / Website</label>
                <input
                  type="url"
                  id="portfolioLink"
                  name="portfolioLink"
                  value={formData.portfolioLink}
                  onChange={handleChange}
                  placeholder="https://my-art-portfolio.com"
                />
              </div>

              <div className="form-group theme-color-group">
                <label htmlFor="accentColor">Theme Color</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    id="accentColor"
                    name="accentColor"
                    value={formData.accentColor}
                    onChange={handleChange}
                    className="color-picker"
                  />
                  <span className="color-hex">{formData.accentColor.toUpperCase()}</span>
                </div>
              </div>

              {/* Hidden File Inputs */}
              <input 
                type="file" 
                ref={avatarInputRef} 
                onChange={(e) => handleFileUpload(e, 'avatar')} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              <input 
                type="file" 
                ref={bannerInputRef} 
                onChange={(e) => handleFileUpload(e, 'bannerUrl')} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />

              <div className="modal-actions settings-actions">
                <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-confirm" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Profile Preview */}
          <div className="user-settings-preview-section">
            <h3>Preview</h3>
            <div className="profile-card-preview" style={{ '--accent-color': formData.accentColor }}>
              {/* Banner Area */}
              <div 
                className="profile-banner" 
                style={{ 
                  backgroundColor: formData.accentColor,
                  backgroundImage: formData.bannerUrl ? `url(${formData.bannerUrl})` : 'none'
                }}
              >
                <button 
                  className="edit-image-btn banner-edit-btn"
                  onClick={() => bannerInputRef.current.click()}
                  title="Change Banner"
                >
                  ✎
                </button>
              </div>

              {/* Avatar Area */}
              <div className="profile-avatar-container">
                <img src={formData.avatar} alt="Avatar" className="profile-avatar" />
                <button 
                  className="edit-image-btn avatar-edit-btn"
                  onClick={() => avatarInputRef.current.click()}
                  title="Change Avatar"
                >
                  ✎
                </button>
              </div>

              {/* Profile Details */}
              <div className="profile-card-body">
                <div className="profile-name-area">
                  <h3 className="profile-display-name">{displayName}</h3>
                  <span className="profile-username">@{user.username}</span>
                  {formData.pronouns && <span className="profile-pronouns"> • {formData.pronouns}</span>}
                </div>

                <div className="divider"></div>

                <div className="profile-section">
                  <h4>About Me</h4>
                  <p className="profile-bio">
                    {formData.bio || <span className="empty-placeholder">No bio provided yet...</span>}
                  </p>
                </div>

                {formData.portfolioLink && (
                  <div className="profile-section">
                    <h4>Portfolio</h4>
                    <a href={formData.portfolioLink} target="_blank" rel="noopener noreferrer" className="profile-link">
                      {formData.portfolioLink.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
