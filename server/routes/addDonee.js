const express = require('express');
const router = express.Router();
const Donee = require('../models/donee');

router.post('/', async (req, res) => {
  try {
    const { name, contact, email, address, beneficiaries, lat, lng } = req.body;
    
    // Validation
    if (!name || !contact || !lat || !lng) {
      return res.status(400).json({ error: 'Name, contact, latitude, and longitude are required' });
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    const donee = new Donee({
      name,
      contact,
      email,
      address,
      beneficiaries,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }
    });
    await donee.save();
    res.json({ message: 'Donee added', donee });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
