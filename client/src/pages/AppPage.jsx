// ============================================
// AppPage Component
// ============================================
// The core application screen. Sets up the 3-column layout,
// handles active server/channel state, and manages the
// global Socket.io real-time connection.

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import ServerSidebar from '../components/ServerSidebar';
import ChannelSidebar from '../components/ChannelSidebar';
import ChatArea from '../components/ChatArea';

export default function AppPage() {
  const { user } = useAuth();
  const [activeServer, setActiveServer] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize Socket.io connection once when the component mounts
  useEffect(() => {
    // Connect to the backend Socket.io server (port 5000)
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
    });

    setSocket(newSocket);

    // Debugging connection status
    newSocket.on('connect', () => {
      console.log('⚡ Connected to Socket.io server');
    });

    // Cleanup: disconnect when user logs out or closes the app
    return () => {
      newSocket.disconnect();
      console.log('❌ Disconnected from Socket.io server');
    };
  }, []);

  // When the active server changes, we reset the active channel
  const handleServerChange = (server) => {
    setActiveServer(server);
    setActiveChannel(null);
  };

  return (
    <div className="app-layout">
      {/* Column 1: Server Icons Sidebar (72px) */}
      <ServerSidebar
        activeServer={activeServer}
        onServerSelect={handleServerChange}
      />

      {/* Column 2: Channel List Sidebar (240px) */}
      <ChannelSidebar
        activeServer={activeServer}
        activeChannel={activeChannel}
        onChannelSelect={setActiveChannel}
      />

      {/* Column 3: Main Chat Area (Flex-grow) */}
      <ChatArea
        activeServer={activeServer}
        activeChannel={activeChannel}
        socket={socket}
      />
    </div>
  );
}
