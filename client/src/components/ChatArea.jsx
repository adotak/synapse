// ============================================
// ChatArea Component — The Heart of Synapse
// ============================================
// This is the most important component. It handles:
// 1. Fetching message history from the REST API
// 2. Listening for real-time messages via Socket.io
// 3. Rendering messages with avatars, timestamps, and file attachments
// 4. Auto-scrolling to the newest message
// 5. Managing Socket.io room join/leave lifecycle

import React, { useState, useEffect, useRef } from 'react';
import { api, useAuth } from '../context/AuthContext';
import MessageInput from './MessageInput';

// ---- Helper: Format timestamps ----
// Turns an ISO date string into a human-readable format
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return `${date.toLocaleDateString()} ${time}`;
}

// ---- Helper: Check if a URL points to an image ----
function isImageUrl(url) {
  return /\.(jpeg|jpg|png|gif|webp)$/i.test(url);
}

// ---- Helper: Get avatar color from username ----
// Generates a consistent color per user so avatars look distinct
const avatarColors = [
  '#5865f2', '#3ba55c', '#ed4245', '#faa61a',
  '#eb459e', '#57f287', '#fee75c', '#5865f2',
  '#9b59b6', '#e91e63', '#00bcd4', '#ff5722',
];

function getAvatarColor(username) {
  if (!username) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function ChatArea({ activeServer, activeChannel, socket }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Ref to the bottom of the messages list — used for auto-scrolling
  const messagesEndRef = useRef(null);
  // Ref to track the current channel for the socket listener
  const currentChannelRef = useRef(null);

  // ---- Scroll to the bottom of the chat ----
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // ---- Fetch messages + manage Socket.io rooms ----
  useEffect(() => {
    if (!activeChannel || !socket) return;

    const channelId = activeChannel._id;
    currentChannelRef.current = channelId;

    // 1. Leave previous channel room (if any)
    // Socket.io rooms ensure you only receive messages for channels you're viewing
    // We don't need to track the previous channel — the server handles it

    // 2. Join the new channel room
    socket.emit('joinChannel', { channelId });

    // 3. Fetch message history from the REST API
    const fetchMessages = async () => {
      setLoading(true);
      setMessages([]); // Clear previous channel's messages immediately
      try {
        const response = await api.get(`/api/messages/${channelId}`);
        // Only update if we're still on the same channel
        if (currentChannelRef.current === channelId) {
          setMessages(response.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        if (currentChannelRef.current === channelId) {
          setLoading(false);
        }
      }
    };

    fetchMessages();

    // 4. Listen for real-time new messages via Socket.io
    const handleNewMessage = (message) => {
      // Only add the message if it belongs to the current channel
      if (currentChannelRef.current === channelId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('newMessage', handleNewMessage);

    // 5. Cleanup — runs when channel changes or component unmounts
    // THIS IS CRITICAL: without this, listeners stack up on every channel switch
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.emit('leaveChannel', { channelId });
    };
  }, [activeChannel?._id, socket]);

  // ---- Auto-scroll when new messages arrive ----
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(messages.length <= 50 ? 'instant' : 'smooth');
    }
  }, [messages]);

  // ---- No channel selected state ----
  if (!activeChannel) {
    return (
      <div className="chat-area">
        <div className="no-selection">
          <div className="no-selection-icon">💬</div>
          <h2>
            {activeServer ? 'Select a channel' : 'Select a server'}
          </h2>
          <p>
            {activeServer
              ? 'Pick a text channel from the sidebar to start chatting'
              : 'Choose a server from the left to see its channels'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      {/* Chat Header — shows the channel name */}
      <div className="chat-header">
        <div className="chat-header-channel">
          <span className="chat-header-hash">#</span>
          {activeChannel.name}
        </div>
      </div>

      {/* Messages Container — scrollable */}
      <div className="messages-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Channel Welcome Message */}
            <div className="channel-welcome">
              <h2>Welcome to #{activeChannel.name}!</h2>
              <p>This is the start of the #{activeChannel.name} channel. Say hello! 👋</p>
            </div>

            {/* Messages List */}
            <div className="messages-list">
              {messages.map((msg, index) => {
                // Determine the author info
                const authorName = msg.author?.username || 'Unknown User';
                const authorInitial = authorName.charAt(0).toUpperCase();
                const avatarColor = getAvatarColor(authorName);

                // Check if this message is from the same author as the previous one
                // If so, we can render a compact version (no avatar/name repeated)
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const sameAuthor = prevMsg &&
                  prevMsg.author?._id === msg.author?._id &&
                  new Date(msg.createdAt) - new Date(prevMsg.createdAt) < 5 * 60 * 1000; // within 5 min

                return (
                  <div key={msg._id || index} className={`message ${sameAuthor ? 'message-compact' : ''}`}>
                    {!sameAuthor ? (
                      <>
                        {/* Avatar */}
                        <div
                          className="message-avatar"
                          style={{ backgroundColor: avatarColor }}
                        >
                          {authorInitial}
                        </div>

                        {/* Message body with header */}
                        <div className="message-body">
                          <div className="message-header">
                            <span className="message-author">{authorName}</span>
                            <span className="message-timestamp">
                              {formatTimestamp(msg.createdAt)}
                            </span>
                          </div>
                          {msg.content && (
                            <div className="message-content">{msg.content}</div>
                          )}
                          {/* File attachment */}
                          {msg.fileUrl && (
                            <div className="message-file">
                              {isImageUrl(msg.fileUrl) ? (
                                <img
                                  src={`http://localhost:5000${msg.fileUrl}`}
                                  alt="Attachment"
                                  loading="lazy"
                                />
                              ) : (
                                <a
                                  href={`http://localhost:5000${msg.fileUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  📎 {msg.fileUrl.split('/').pop()}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Compact message — same author, within 5 min */}
                        <div className="message-avatar-spacer" />
                        <div className="message-body">
                          {msg.content && (
                            <div className="message-content">{msg.content}</div>
                          )}
                          {msg.fileUrl && (
                            <div className="message-file">
                              {isImageUrl(msg.fileUrl) ? (
                                <img
                                  src={`http://localhost:5000${msg.fileUrl}`}
                                  alt="Attachment"
                                  loading="lazy"
                                />
                              ) : (
                                <a
                                  href={`http://localhost:5000${msg.fileUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  📎 {msg.fileUrl.split('/').pop()}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {/* Invisible element at the bottom — scrollIntoView target */}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        channelId={activeChannel._id}
        channelName={activeChannel.name}
        socket={socket}
      />
    </div>
  );
}
