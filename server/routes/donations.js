const express = require('express');
const router = express.Router();
const Donee = require('../models/donee');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Import the auth middleware
const { sendDonationNotification } = require('../utils/mailer');

// Route to notify a donee about a donation
router.post('/notify/:doneeId', auth, async (req, res) => {
  try {
    // Get donor info from authenticated user
    const userId = req.user.userId;
    const donor = await User.findById(userId);
    
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }
    
    // Get donee info
    const doneeId = req.params.doneeId;
    const donee = await Donee.findById(doneeId);
    
    if (!donee) {
      return res.status(404).json({ success: false, message: 'Donee not found' });
    }
    
    // Check if donee has an email
    if (!donee.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'This donee cannot be notified by email. Please contact them directly.'
      });
    }

    // Send email notification
    await sendDonationNotification(
      { name: donee.name, email: donee.email },
      { name: donor.name, contact: req.body.contact || 'Not provided' }
    );
    
    res.json({ 
      success: true, 
      message: `Donation notification sent to ${donee.name}`
    });
  } catch (error) {
    console.error('Donation notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send donation notification',
      error: error.message
    });
  }
});

module.exports = router;