// ============================================
// Synapse Server — Main Entry Point
// ============================================
// This file wires together:
// 1. Express (HTTP API server)
// 2. MongoDB (database connection via Mongoose)
// 3. Socket.io (real-time messaging engine)
// 4. Multer (file upload handling)
// 5. All route files (auth, servers, channels, messages)

// Load environment variables from .env file FIRST
// This must be at the very top so process.env.* works everywhere
require('dotenv').config();

const express = require('express');
const http = require('http');        // Node.js built-in HTTP module
const { Server } = require('socket.io'); // Socket.io server
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import route files
const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/servers');
const channelRoutes = require('./routes/channels');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');

// Import models (needed for Socket.io message handling)
const Message = require('./models/Message');
const User = require('./models/User');

// ============================================
// 1. Create Express App + HTTP Server
// ============================================
const app = express();

// http.createServer wraps Express so Socket.io can share the same port
const httpServer = http.createServer(app);

// ============================================
// 2. Configure Socket.io
// ============================================
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// ============================================
// 3. Middleware
// ============================================
// CORS — allows the React frontend (port 3000) to call our API (port 5000)
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Parse JSON request bodies (when frontend sends JSON data)
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static assets
// If someone uploads "image.png", it's accessible at http://localhost:5000/uploads/image.png
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ============================================
// 4. Multer Configuration (File Uploads)
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp-originalname
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|mp4|mp3/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images, documents, and media files are allowed.'));
    }
  },
});

// ============================================
// 5. API Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Return the URL where the file can be accessed
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ data: { fileUrl } });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Synapse server is running!' });
});

// ============================================
// 6. Socket.io Event Handlers (Real-Time)
// ============================================
io.on('connection', (socket) => {
  console.log(`⚡ User connected: ${socket.id}`);

  // ---- joinChannel ----
  // When a user opens a channel, they "join" its room
  // so they receive messages sent to that channel
  socket.on('joinChannel', ({ channelId }) => {
    socket.join(channelId);
    console.log(`📢 Socket ${socket.id} joined channel: ${channelId}`);

    // Notify others in the channel (optional)
    socket.to(channelId).emit('userJoined', {
      username: 'A user',
      channelId,
    });
  });

  // ---- sendMessage ----
  // When a user sends a message, we:
  // 1. Save it to MongoDB
  // 2. Populate the author info
  // 3. Emit it to everyone in the channel room
  socket.on('sendMessage', async ({ content, authorId, channelId, fileUrl }) => {
    try {
      // Create and save the message to the database
      const message = new Message({
        content: content || '',
        author: authorId,
        channel: channelId,
        fileUrl: fileUrl || '',
      });

      await message.save();

      // Populate the author field so the frontend gets { _id, username, avatar }
      // instead of just the author's ObjectId
      await message.populate('author', 'username avatar _id');

      // Emit the complete message to ALL sockets in this channel room
      // (including the sender — so they see their own message appear)
      io.to(channelId).emit('newMessage', message);

      console.log(`💬 Message in channel ${channelId} by ${message.author.username}`);
    } catch (error) {
      console.error('Socket sendMessage error:', error);
      socket.emit('error', { error: 'Failed to send message.' });
    }
  });

  // ---- leaveChannel ----
  // When a user switches to a different channel
  socket.on('leaveChannel', ({ channelId }) => {
    socket.leave(channelId);
    console.log(`🚪 Socket ${socket.id} left channel: ${channelId}`);
  });

  // ---- disconnect ----
  // When a user closes the tab or loses connection
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// ============================================
// 7. Connect to MongoDB and Start Server
// ============================================
const PORT = process.env.PORT || 5000;

async function startServer() {
  let mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri || mongodbUri.includes('YOUR_USERNAME') || mongodbUri.includes('xxxxx')) {
    console.log('⚠️  No valid MONGODB_URI found in environment variables.');
    console.log('🚀 Starting local in-memory MongoDB server using mongodb-memory-server...');
    try {
      const dbPath = path.join(__dirname, 'db_data');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'synapse',
          dbPath: dbPath,
        },
        binary: {
          version: '4.4.29', // E5-1620 v2 compatible (AVX support only, no AVX2 requirements)
        },
      });
      mongodbUri = mongoServer.getUri();
      console.log(`✅ In-Memory MongoDB started at: ${mongodbUri}`);
    } catch (err) {
      console.error('❌ Failed to start In-Memory MongoDB:', err.message);
      process.exit(1);
    }
  }

  mongoose
    .connect(mongodbUri)
    .then(() => {
      console.log('✅ Connected to MongoDB');

      // Only start the server AFTER the database is connected
      httpServer.listen(PORT, () => {
        console.log(`🚀 Synapse server running on http://localhost:${PORT}`);
        console.log(`📡 Socket.io ready for real-time connections`);
        console.log(`🌐 CORS enabled for ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
      });
    })
    .catch((error) => {
      console.error('❌ MongoDB connection failed:', error.message);
      process.exit(1);
    });
}

startServer();
