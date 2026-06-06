// ============================================
// Channel Model — text channels inside a server
// ============================================
// Channels belong to a server. Think of them like rooms
// inside a building — each room has its own conversation.

const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema(
  {
    // Channel name — displayed with a # prefix (e.g., #general)
    name: {
      type: String,
      required: [true, 'Channel name is required'],
      trim: true,
      minlength: [1, 'Channel name cannot be empty'],
      maxlength: [100, 'Channel name is too long'],
    },

    // Which server this channel belongs to
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Channel', channelSchema);
