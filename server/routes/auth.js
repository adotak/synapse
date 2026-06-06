// ============================================
// Auth Routes — Register and Login
// ============================================
// POST /api/auth/register — create a new account
// POST /api/auth/login    — log into an existing account
//
// Both return a JWT token that the frontend stores and sends
// with every future request to prove who the user is.

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ---- Helper: Generate a JWT token ----
// We put the user's ID inside the token so we can identify them later
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },           // payload — data stored inside the token
    process.env.JWT_SECRET,   // secret key — used to sign/verify
    { expiresIn: '7d' }      // token expires in 7 days
  );
};

// ============================================
// POST /api/auth/register
// ============================================
// Creates a new user account.
// Request body: { username, email, password }
// Response: { token, user: { id, username, email, avatar } }
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // --- Validation ---
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required (username, email, password).' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if email is already taken
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Check if username is already taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'This username is already taken.' });
    }

    // --- Hash the password ---
    // bcrypt.genSalt(10) generates a "salt" — random data mixed into the hash
    // The number 10 is the "cost factor" — higher = more secure but slower
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- Create the user in MongoDB ---
    const user = new User({
      username,
      email,
      password: hashedPassword, // store the HASH, never the plain password
    });

    await user.save(); // save() writes the document to the database

    // --- Generate a token and send it back ---
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
});

// ============================================
// POST /api/auth/login
// ============================================
// Logs in an existing user.
// Request body: { email, password }
// Response: { token, user: { id, username, email, avatar } }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Validation ---
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // --- Find the user by email ---
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // --- Check the password ---
    // bcrypt.compare() hashes the input and compares it to the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // --- Generate a token and send it back ---
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
});

module.exports = router;
