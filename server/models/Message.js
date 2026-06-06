// ============================================
// Message Model — individual chat messages
// ============================================
// Each message belongs to a channel and has an author.
// Messages can also have file attachments and emoji reactions.

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // The text content of the message
    content: {
      type: String,
      default: '',
    },

    // Who sent this message — references the User model
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Which channel this message was sent in
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: true,
    },

    // Optional file attachment URL (for image/document sharing)
    fileUrl: {
      type: String,
      default: '',
    },

    // Emoji reactions on this message
    // Each reaction stores the emoji string and which users reacted with it
    reactions: [
      {
        emoji: {
          type: String,
          required: true,
        },
        users: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Message', messageSchema);
