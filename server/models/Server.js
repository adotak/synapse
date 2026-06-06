// ============================================
// Server Model — like a Discord server/guild
// ============================================
// A "server" is a community space that contains channels.
// One user (the owner) creates it, and other users can join.

const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema(
  {
    // The server name displayed in the sidebar
    name: {
      type: String,
      required: [true, 'Server name is required'],
      trim: true,
      minlength: [1, 'Server name cannot be empty'],
      maxlength: [100, 'Server name is too long'],
    },

    // The user who created this server — they have admin privileges
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // All users who are part of this server (including the owner)
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Optional server icon URL
    icon: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Server', serverSchema);
