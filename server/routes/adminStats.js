const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Donee = require('../models/donee');

router.post('/login', async (req, res) => {
  try {
    const { id, password } = req.body;
    
    if (id === 'admin' && password === 'admin') {
      res.json({ success: true, message: 'Admin authenticated' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const doneeCount = await Donee.countDocuments();
    
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

// Get donees with pagination
router.get('/donees', async (req, res) => {
  try {
    const { limit = 3, skip = 0 } = req.query;
    
    const donees = await Donee.find()
      .sort({ _id: -1 }) // Most recent first
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await Donee.countDocuments();
    
    res.json({
      donees,
      total,
      hasMore: (parseInt(skip) + parseInt(limit)) < total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update donee
router.put('/donees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, email, address, beneficiaries, lat, lng } = req.body;
    
    if (!name || !contact || !lat || !lng) {
      return res.status(400).json({ error: 'Name, contact, latitude, and longitude are required' });
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    const updatedDonee = await Donee.findByIdAndUpdate(
      id,
      {
        name,
        contact,
        email,
        address,
        beneficiaries,
        location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedDonee) {
      return res.status(404).json({ error: 'Donee not found' });
    }
    
    res.json({ message: 'Donee updated successfully', donee: updatedDonee });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete donee
router.delete('/donees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedDonee = await Donee.findByIdAndDelete(id);
    
    if (!deletedDonee) {
      return res.status(404).json({ error: 'Donee not found' });
    }
    
    res.json({ message: 'Donee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;