// ============================================
// Server Routes — Create and list servers
// ============================================
// GET  /api/servers  — get all servers the logged-in user belongs to
// POST /api/servers  — create a new server
//
// All routes here are protected by the auth middleware,
// meaning the user must be logged in (have a valid JWT token).

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Server = require('../models/Server');
const Channel = require('../models/Channel');
const User = require('../models/User');

// ============================================
// GET /api/servers
// ============================================
// Returns all servers where the current user is a member.
// The auth middleware puts the user's ID in req.user.id
router.get('/', auth, async (req, res) => {
  try {
    // Find servers where the members array includes this user's ID
    const servers = await Server.find({ members: req.user.id })
      .populate('owner', 'username avatar') // include owner's username and avatar
      .sort({ createdAt: -1 }); // newest first

    res.json({ data: servers });
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({ error: 'Failed to fetch servers.' });
  }
});

// ============================================
// POST /api/servers
// ============================================
// Creates a new server. The logged-in user becomes the owner.
// Also creates a default #general channel automatically.
// Request body: { name }
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Server name is required.' });
    }

    // Create the server with the current user as owner AND first member
    const server = new Server({
      name: name.trim(),
      owner: req.user.id,
      members: [req.user.id], // owner is automatically a member
    });

    await server.save();

    // Create a default #general channel so there's something to chat in right away
    const generalChannel = new Channel({
      name: 'general',
      server: server._id,
    });

    await generalChannel.save();

    // Add this server to the user's servers list
    await User.findByIdAndUpdate(req.user.id, {
      $push: { servers: server._id },
    });

    // Populate the owner field before sending back
    await server.populate('owner', 'username avatar');

    res.status(201).json({ data: server });
  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({ error: 'Failed to create server.' });
  }
});

// ============================================
// POST /api/servers/:id/join
// ============================================
// Allows a user to join an existing server
router.post('/:id/join', auth, async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);

    if (!server) {
      return res.status(404).json({ error: 'Server not found.' });
    }

    // Check if user is already a member
    if (server.members.includes(req.user.id)) {
      return res.status(400).json({ error: 'You are already a member of this server.' });
    }

    // Add user to server's members
    server.members.push(req.user.id);
    await server.save();

    // Add server to user's servers list
    await User.findByIdAndUpdate(req.user.id, {
      $push: { servers: server._id },
    });

    await server.populate('owner', 'username avatar');

    res.json({ data: server });
  } catch (error) {
    console.error('Join server error:', error);
    res.status(500).json({ error: 'Failed to join server.' });
  }
});

module.exports = router;
