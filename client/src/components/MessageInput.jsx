// ============================================
// MessageInput Component
// ============================================
// The message composition bar at the bottom of the chat area.
// Features:
// - Textarea with auto-resize
// - Enter to send, Shift+Enter for new line
// - File upload via the /api/upload endpoint
// - Send button with disabled state
// - Sends messages via Socket.io (not HTTP POST)

import React, { useState, useRef } from 'react';
import { api, useAuth } from '../context/AuthContext';

export default function MessageInput({ channelId, channelName, socket }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // ---- Send a text message via Socket.io ----
  const sendMessage = () => {
    const trimmed = content.trim();
    if (!trimmed || !socket || !channelId) return;

    // Emit the sendMessage event to the Socket.io server
    // The server saves it to MongoDB and broadcasts it to all users in the channel
    socket.emit('sendMessage', {
      content: trimmed,
      authorId: user.id,
      channelId,
    });

    // Clear the input and reset height
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // ---- Handle keyboard events ----
  const handleKeyDown = (e) => {
    // Enter = send, Shift+Enter = new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // prevent the newline character
      sendMessage();
    }
  };

  // ---- Auto-resize textarea as user types ----
  const handleInput = (e) => {
    setContent(e.target.value);

    // Reset height to auto so it shrinks when text is deleted
    const textarea = e.target;
    textarea.style.height = 'auto';
    // Set height to scrollHeight (actual content height)
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  // ---- File Upload ----
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !socket || !channelId) return;

    setIsUploading(true);

    try {
      // Step 1: Upload the file to the server via /api/upload
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const fileUrl = response.data.data?.fileUrl;

      if (fileUrl) {
        // Step 2: Send a message with the file URL via Socket.io
        socket.emit('sendMessage', {
          content: content.trim() || '',
          authorId: user.id,
          channelId,
          fileUrl,
        });

        setContent('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    } catch (err) {
      console.error('File upload failed:', err);
      alert('File upload failed. Max size is 10MB.');
    } finally {
      setIsUploading(false);
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const canSend = content.trim().length > 0 && !isUploading;

  return (
    <div className="message-input-container">
      <div className="message-input-wrapper">
        {/* File Upload Button */}
        <div className="message-input-actions" style={{ paddingRight: 0 }}>
          <button
            className="input-action-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Upload a file"
          >
            {isUploading ? '⏳' : '📎'}
          </button>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.txt,.mp4,.mp3"
            style={{ display: 'none' }}
          />
        </div>

        {/* Message Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName}`}
          rows={1}
          disabled={isUploading}
        />

        {/* Send Button */}
        <div className="message-input-actions">
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={!canSend}
            title="Send message"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
