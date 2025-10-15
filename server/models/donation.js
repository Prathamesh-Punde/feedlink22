const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donee',
    required: true
  },
  donorContact: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  foodType: {
    type: String,
    default: 'Food donation'
  },
  quantity: {
    type: String,
    default: 'Not specified'
  },
  estimatedPeople: {
    type: Number,
    default: 1
  },
  scheduledTime: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String
  },
  confirmationToken: {
    type: String,
    unique: true
  },
  confirmedByDonee: {
    type: Boolean,
    default: false
  },
  donorName: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
donationSchema.index({ donor: 1 });
donationSchema.index({ donee: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);