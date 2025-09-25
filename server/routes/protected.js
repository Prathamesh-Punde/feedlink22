const express = require('express');
const router = express.Router();
const path = require('path');
const auth = require('../middleware/auth');

// Base directory for client files
const clientDir = path.join(__dirname, '../../client');

// Protected route for the Donate page
// This will check if the user is authenticated before serving the page
router.get('/Donate.html', auth, (req, res) => {
  res.sendFile(path.join(clientDir, 'Donate.html'));
});

// You can add more protected routes here as needed

module.exports = router;