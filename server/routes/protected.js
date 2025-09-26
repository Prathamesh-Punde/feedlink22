const express = require('express');
const router = express.Router();
const path = require('path');
const auth = require('../middleware/auth');

// Base directory for client files
const clientDir = path.join(__dirname, '../../client');


router.get('/Donate.html', auth, (req, res) => {
  res.sendFile(path.join(clientDir, 'Donate.html'));
});



module.exports = router;