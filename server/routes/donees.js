const express = require('express');
const router = express.Router();
const Donee = require('../models/donee');
const multer = require('multer');
const path = require('path');
const { sendDoneeVerificationEmail, sendDoneeRejectionEmail } = require('../utils/mailer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Register new donee
router.post('/register', upload.array('documents', 5), async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      organizationType,
      organizationName,
      description,
      address,
      street,
      city,
      state,
      zipCode,
      averagePeopleServed,
      operatingHoursFrom,
      operatingHoursTo,
      specialRequirements,
      registrationNumber,
      latitude,
      longitude
    } = req.body;

    // Check if donee already exists
    const existingDonee = await Donee.findOne({ email });
    if (existingDonee) {
      return res.status(400).json({ error: 'A donee with this email already exists' });
    }

    // Parse special requirements if it's a string
    let parsedRequirements = [];
    if (specialRequirements) {
      parsedRequirements = typeof specialRequirements === 'string' 
        ? specialRequirements.split(',').map(req => req.trim()).filter(req => req)
        : specialRequirements;
    }

    // Process uploaded documents
    const documents = req.files ? req.files.map(file => ({
      type: 'other', // You can enhance this to detect document type
      filename: file.filename,
      uploadDate: new Date()
    })) : [];

    // Create donee object
    const doneeData = {
      name,
      email,
      phone,
      organizationType,
      organizationName,
      description,
      address: address || `${street}, ${city}, ${state} ${zipCode}`,
      contact: phone, // For backward compatibility
      fullAddress: {
        street,
        city,
        state,
        zipCode
      },
      averagePeopleServed: parseInt(averagePeopleServed),
      operatingHours: {
        from: operatingHoursFrom,
        to: operatingHoursTo
      },
      specialRequirements: parsedRequirements,
      registrationNumber,
      documents,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude || 0), parseFloat(latitude || 0)]
      },
      status: 'pending'
    };

    const donee = new Donee(doneeData);
    await donee.save();

    res.status(201).json({
      message: 'Donee registration submitted successfully! You will be notified once verified.',
      doneeId: donee._id
    });

  } catch (error) {
    console.error('Donee registration error:', error);
    res.status(500).json({ 
      error: 'Failed to register donee',
      details: error.message 
    });
  }
});

// Get all donees (for admin)
router.get('/', async (req, res) => {
  try {
    const { status, limit = 10, skip = 0 } = req.query;
    
    const filter = status ? { status } : {};
    const donees = await Donee.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(donees);
  } catch (error) {
    console.error('Error fetching donees:', error);
    res.status(500).json({ error: 'Failed to fetch donees' });
  }
});

// Get single donee by ID
router.get('/:id', async (req, res) => {
  try {
    const donee = await Donee.findById(req.params.id);
    if (!donee) {
      return res.status(404).json({ error: 'Donee not found' });
    }
    res.json(donee);
  } catch (error) {
    console.error('Error fetching donee:', error);
    res.status(500).json({ error: 'Failed to fetch donee' });
  }
});

// Update donee status (for admin verification)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'verified', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = { status };
    if (status === 'verified') {
      updateData.verificationDate = new Date();
    }

    const donee = await Donee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!donee) {
      return res.status(404).json({ error: 'Donee not found' });
    }

    // Send appropriate email based on status change
    if (status === 'verified') {
      try {
        await sendDoneeVerificationEmail(donee);
        console.log(`Verification email sent to ${donee.email} for organization: ${donee.organizationName}`);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail the status update if email fails
      }
    } else if (status === 'suspended') {
      try {
        await sendDoneeRejectionEmail(donee, 'Your organization has been suspended. Please contact us for more information.');
        console.log(`Suspension email sent to ${donee.email} for organization: ${donee.organizationName}`);
      } catch (emailError) {
        console.error('Failed to send suspension email:', emailError);
        // Don't fail the status update if email fails
      }
    }

    const message = status === 'verified' 
      ? 'Donee verified successfully and notification email sent!' 
      : status === 'suspended'
      ? 'Donee suspended and notification email sent!'
      : 'Donee status updated successfully';

    res.json({ message, donee });
  } catch (error) {
    console.error('Error updating donee status:', error);
    res.status(500).json({ error: 'Failed to update donee status' });
  }
});

// Reject donee with custom reason
router.patch('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const donee = await Donee.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'suspended',
        rejectionReason: reason,
        rejectionDate: new Date()
      },
      { new: true }
    );

    if (!donee) {
      return res.status(404).json({ error: 'Donee not found' });
    }

    // Send rejection email with custom reason
    try {
      await sendDoneeRejectionEmail(donee, reason);
      console.log(`Rejection email sent to ${donee.email} for organization: ${donee.organizationName}`);
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Don't fail the rejection if email fails
    }

    res.json({ 
      message: 'Donee rejected and notification email sent!', 
      donee 
    });
  } catch (error) {
    console.error('Error rejecting donee:', error);
    res.status(500).json({ error: 'Failed to reject donee' });
  }
});

// Find nearby donees
router.get('/nearby/:longitude/:latitude', async (req, res) => {
  try {
    const { longitude, latitude } = req.params;
    const { maxDistance = 10000 } = req.query; // Default 10km
    
    const donees = await Donee.findNearby(
      parseFloat(longitude), 
      parseFloat(latitude), 
      parseInt(maxDistance)
    );
    
    res.json(donees);
  } catch (error) {
    console.error('Error finding nearby donees:', error);
    res.status(500).json({ error: 'Failed to find nearby donees' });
  }
});

module.exports = router;