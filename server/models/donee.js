const mongoose = require('mongoose');

const doneeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  contact: { type: String, required: true },
  beneficiaries: { type: Number, default: 0 },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true } // [lng, lat]
  }
});
doneeSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Donee', doneeSchema);
