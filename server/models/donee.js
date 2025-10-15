const mongoose = require('mongoose');

const doneeSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true 
  },
  phone: { type: String, required: true, trim: true },
  
  // Organization Details
  organizationType: {
    type: String,
    required: true,
    enum: ['NGO', 'Orphanage', 'Old Age Home', 'School', 'Hospital', 'Community Center', 'Religious Organization', 'Other']
  },
  organizationName: { type: String, required: true, trim: true },
  description: { type: String, required: true, maxlength: 1000 },
  
  // Address (keeping backward compatibility)
  address: { type: String, required: true },
  contact: { type: String, required: true }, // keeping for backward compatibility
  
  // Enhanced Location
  fullAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  
  // Capacity and Requirements
  averagePeopleServed: { type: Number, required: true, min: 1 },
  operatingHours: {
    from: { type: String, required: true },
    to: { type: String, required: true }
  },
  specialRequirements: {
    type: [String],
    default: []
  },
  
  // Verification and Status
  status: {
    type: String,
    enum: ['pending', 'verified', 'suspended'],
    default: 'pending'
  },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verificationDate: Date,
  
  // Documents
  registrationNumber: String,
  documents: [{
    type: { type: String, enum: ['registration_certificate', 'id_proof', 'address_proof', 'other'] },
    filename: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  
  // Statistics (keeping backward compatibility)
  beneficiaries: { type: Number, default: 0 },
  totalDonationsReceived: { type: Number, default: 0 },
  lastDonationDate: Date,
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  
  // Geospatial data (keeping backward compatibility)
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true } // [lng, lat]
  }
}, {
  timestamps: true
});

// Index for geospatial queries
doneeSchema.index({ location: '2dsphere' });

// Method to calculate average rating
doneeSchema.methods.calculateAverageRating = function() {
  if (this.totalRatings === 0) return 0;
  return Math.round((this.rating / this.totalRatings) * 10) / 10;
};

// Static method to find nearby donees
doneeSchema.statics.findNearby = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    status: 'verified'
  });
};

module.exports = mongoose.model('Donee', doneeSchema);
