const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Donee = require('../models/donee');

// Admin authentication endpoint
router.post('/login', async (req, res) => {
  try {
    const { id, password } = req.body;
    
    // Hardcoded admin credentials (in production, use proper authentication)
    if (id === 'admin' && password === 'admin') {
      res.json({ success: true, message: 'Admin authenticated' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get admin dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const doneeCount = await Donee.countDocuments();
    
    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      totalUsers: userCount,
      totalDonees: doneeCount,
      recentUsers: recentUsers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;