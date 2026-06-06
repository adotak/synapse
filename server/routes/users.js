const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// ============================================
// GET /api/users/:id
// Fetch public profile data for any user
// ============================================
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email -servers') // Exclude private info
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// PUT /api/users/profile
// Update the authenticated user's profile
// ============================================
router.put('/profile', auth, async (req, res) => {
  try {
    // Only allow updating specific fields
    const {
      nickname,
      bio,
      pronouns,
      portfolioLink,
      accentColor,
      avatar,
      bannerUrl
    } = req.body;

    const updateFields = {};
    if (nickname !== undefined) updateFields.nickname = nickname;
    if (bio !== undefined) updateFields.bio = bio;
    if (pronouns !== undefined) updateFields.pronouns = pronouns;
    if (portfolioLink !== undefined) updateFields.portfolioLink = portfolioLink;
    if (accentColor !== undefined) updateFields.accentColor = accentColor;
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (bannerUrl !== undefined) updateFields.bannerUrl = bannerUrl;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password'); // Return the updated user without password

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: updatedUser });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
});

module.exports = router;
