const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Donee = require('../models/donee');
const User = require('../models/User');
const Donation = require('../models/donation');
const auth = require('../middleware/auth'); 
const { sendDonationNotification } = require('../utils/mailer');

router.post('/notify/:doneeId', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const donor = await User.findById(userId);
    
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }
    
    const doneeId = req.params.doneeId;
    const donee = await Donee.findById(doneeId);
    
    if (!donee) {
      return res.status(404).json({ success: false, message: 'Donee not found' });
    }
    
    if (!donee.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'This donee cannot be notified by email. Please contact them directly.'
      });
    }

    const { contact, foodType, quantity, estimatedPeople, scheduledTime, notes } = req.body;

    // Generate unique confirmation token
    const confirmationToken = crypto.randomBytes(32).toString('hex');

    // Create donation record
    const donation = new Donation({
      donor: userId,
      donee: doneeId,
      donorContact: contact || 'Not provided',
      donorName: donor.name,
      foodType: foodType || 'Food donation',
      quantity: quantity || 'Not specified',
      estimatedPeople: estimatedPeople || 1,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
      notes: notes || '',
      confirmationToken: confirmationToken
    });

    await donation.save();

    await sendDonationNotification(
      { name: donee.name, email: donee.email },
      { name: donor.name, contact: contact || 'Not provided' },
      donation._id,
      confirmationToken
    );
    
    res.json({ 
      success: true, 
      message: `Donation notification sent to ${donee.name}`,
      donationId: donation._id
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

// Update donation status
router.put('/:donationId/status', auth, async (req, res) => {
  try {
    const { donationId } = req.params;
    const { status, rating, feedback } = req.body;
    
    const donation = await Donation.findById(donationId);
    
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }
    
    // Check if user is the donor
    if (donation.donor.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this donation' });
    }
    
    donation.status = status || donation.status;
    
    if (status === 'completed') {
      donation.completedAt = new Date();
    }
    
    if (rating) donation.rating = rating;
    if (feedback) donation.feedback = feedback;
    
    await donation.save();
    
    res.json({ 
      success: true, 
      message: 'Donation status updated successfully',
      donation
    });
  } catch (error) {
    console.error('Update donation status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update donation status',
      error: error.message
    });
  }
});

// Confirm donation completion (for donees)
router.get('/:donationId/confirm', async (req, res) => {
  try {
    const { donationId } = req.params;
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">❌ Invalid Confirmation Link</h2>
            <p>The confirmation token is missing. Please use the link from your email.</p>
          </body>
        </html>
      `);
    }
    
    const donation = await Donation.findById(donationId).populate('donor', 'name').populate('donee', 'name');
    
    if (!donation) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">❌ Donation Not Found</h2>
            <p>The donation record could not be found.</p>
          </body>
        </html>
      `);
    }
    
    if (donation.confirmationToken !== token) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">❌ Invalid Token</h2>
            <p>The confirmation token is invalid or has expired.</p>
          </body>
        </html>
      `);
    }
    
    if (donation.confirmedByDonee) {
      return res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #28a745;">✅ Already Confirmed</h2>
            <p>This donation has already been confirmed. Thank you!</p>
            <div style="margin-top: 30px;">
              <p><strong>Donation Details:</strong></p>
              <p>Donor: ${donation.donorName}</p>
              <p>Date: ${donation.createdAt.toLocaleDateString()}</p>
              <p>Status: ${donation.status}</p>
            </div>
          </body>
        </html>
      `);
    }
    
    // Update donation as confirmed and completed
    donation.confirmedByDonee = true;
    donation.status = 'completed';
    donation.completedAt = new Date();
    await donation.save();
    
    // Update donee statistics
    await Donee.findByIdAndUpdate(donation.donee._id, {
      $inc: { totalDonationsReceived: 1 },
      lastDonationDate: new Date()
    });
    
    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
            <h1 style="color: #28a745; margin-bottom: 20px;">🎉 Donation Confirmed Successfully!</h1>
            <p style="font-size: 18px; color: #333; margin-bottom: 30px;">Thank you for confirming the donation from <strong>${donation.donorName}</strong>!</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Donation Details:</h3>
              <p><strong>Donor:</strong> ${donation.donorName}</p>
              <p><strong>Date:</strong> ${donation.createdAt.toLocaleDateString()}</p>
              <p><strong>Food Type:</strong> ${donation.foodType}</p>
              <p><strong>Estimated People Served:</strong> ${donation.estimatedPeople}</p>
            </div>
            
            <p style="color: #666;">This donation has been marked as completed in our system. Thank you for being part of the FeedLink community!</p>
            
            <div style="margin-top: 40px;">
              <a href="mailto:feedlink.info@gmail.com" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                Contact FeedLink Team
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 14px;">
              <p>© ${new Date().getFullYear()} FeedLink. Making a difference, one meal at a time.</p>
            </div>
          </div>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Donation confirmation error:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #dc3545;">❌ Server Error</h2>
          <p>An error occurred while confirming the donation. Please try again or contact support.</p>
        </body>
      </html>
    `);
  }
});

// Get donation statistics for homepage
router.get('/stats', async (req, res) => {
  try {
    const totalDonations = await Donation.countDocuments({ confirmedByDonee: true });
    const pendingDonations = await Donation.countDocuments({ status: 'pending' });
    
    // Get last 3 confirmed donors for homepage display
    const lastThreeDonors = await Donation.find({ 
      confirmedByDonee: true 
    })
      .sort({ completedAt: -1 })
      .limit(3)
      .select('donorName completedAt');
    
    // This month's confirmed donations
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthDonations = await Donation.countDocuments({
      confirmedByDonee: true,
      completedAt: { $gte: thisMonth }
    });
    
    res.json({
      totalDonations,
      thisMonthDonations,
      lastThreeDonors: lastThreeDonors.map(donation => ({
        name: donation.donorName,
        date: donation.completedAt
      }))
    });
  } catch (error) {
    console.error('Get donation stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get donation statistics',
      error: error.message
    });
  }
});

// Get user's donation history
router.get('/my-donations', auth, async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user.userId })
      .populate('donee', 'name contact address')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      donations
    });
  } catch (error) {
    console.error('Get user donations error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get donation history',
      error: error.message
    });
  }
});

module.exports = router;