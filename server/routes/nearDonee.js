const express = require('express');
const router = express.Router();
const Donee = require('../models/donee');

router.get('/', async (req, res) => {
  try {
    const { lat, lng, dist } = req.query;
    const radius = dist ? parseInt(dist) : 5000; // default 5 km

    const donees = await Donee.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: radius
        }
      }
    });

    res.json(donees);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
