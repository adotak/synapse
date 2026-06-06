// ============================================
// User Model — stores registered users
// ============================================
// Each user has a username, email, hashed password, and avatar.
// The "servers" field keeps track of which servers this user belongs to.

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // The display name others see in chat
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Username must be at least 2 characters'],
      maxlength: [32, 'Username cannot exceed 32 characters'],
    },

    // Used for login — must be unique
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },

    // Stored as a bcrypt hash — never store plain text passwords!
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },

    // Profile picture URL (we use a default avatar generator)
    avatar: {
      type: String,
      default: '',
    },

    // Array of Server ObjectIds this user is a member of
    servers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Server',
      },
    ],
  },
  {
    // Mongoose will automatically add createdAt and updatedAt fields
    timestamps: true,
  }
);

// Before saving, generate a default avatar if none is set
userSchema.pre('save', function (next) {
  if (!this.avatar) {
    // Use DiceBear API for a unique avatar based on username
    this.avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(this.username)}`;
  }
  next();
});

// Export the model so other files can use it with: const User = require('./User')
module.exports = mongoose.model('User', userSchema);
