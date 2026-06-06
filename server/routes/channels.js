// ============================================
// Channel Routes — Create and list channels
// ============================================
// GET  /api/channels?server=:id  — get all channels in a server
// POST /api/channels             — create a new channel in a server
//
// Protected by auth middleware — user must be logged in.

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Channel = require('../models/Channel');
const Server = require('../models/Server');

// ============================================
// GET /api/channels?server=:id
// ============================================
// Returns all channels that belong to a specific server.
// The server ID is passed as a query parameter: ?server=abc123
router.get('/', auth, async (req, res) => {
  try {
    const { server: serverId } = req.query;

    if (!serverId) {
      return res.status(400).json({ error: 'Server ID is required. Use ?server=<id>' });
    }

    // Verify the server exists
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found.' });
    }

    // Verify the user is a member of this server
    if (!server.members.map((m) => m.toString()).includes(req.user.id)) {
      return res.status(403).json({ error: 'You are not a member of this server.' });
    }

    // Find all channels belonging to this server
    const channels = await Channel.find({ server: serverId }).sort({ createdAt: 1 }); // oldest first

    res.json({ data: channels });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: 'Failed to fetch channels.' });
  }
});

// ============================================
// POST /api/channels
// ============================================
// Creates a new channel in a server.
// Only the server owner (admin) can create channels.
// Request body: { name, serverId }
router.post('/', auth, async (req, res) => {
  try {
    const { name, serverId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Channel name is required.' });
    }

    if (!serverId) {
      return res.status(400).json({ error: 'Server ID is required.' });
    }

    // Verify the server exists
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found.' });
    }

    // Check if the user is the server owner (admin check)
    if (server.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the server owner can create channels.' });
    }

    // Create the channel
    const channel = new Channel({
      name: name.trim().toLowerCase().replace(/\s+/g, '-'), // "My Channel" → "my-channel"
      server: serverId,
    });

    await channel.save();

    res.status(201).json({ data: channel });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ error: 'Failed to create channel.' });
  }
});

module.exports = router;
