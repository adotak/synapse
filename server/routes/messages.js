// ============================================
// Message Routes — Get messages for a channel
// ============================================
// GET /api/messages/:channelId — get all messages in a channel
//
// Note: SENDING messages is done via Socket.io (real-time),
// not through an HTTP POST route. This route only fetches history.

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Channel = require('../models/Channel');

// ============================================
// GET /api/messages/:channelId
// ============================================
// Returns the last 50 messages for a specific channel.
// Each message includes the author's username and avatar (populated).
router.get('/:channelId', auth, async (req, res) => {
  try {
    const { channelId } = req.params;

    // Verify the channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found.' });
    }

    // Fetch messages for this channel
    // .populate('author', 'username avatar') replaces the author ObjectId
    // with the actual user object (but only the username and avatar fields)
    const messages = await Message.find({ channel: channelId })
      .populate('author', 'username avatar _id') // include author details
      .sort({ createdAt: 1 }) // oldest first (chronological order)
      .limit(50); // only get the last 50 messages

    res.json({ data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

module.exports = router;
