const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const auth = require('../middleware/auth');

// Secure route: Only logged in users (Doctor/Operator) can generate video tokens
router.get('/token', auth(), videoController.generateToken);

module.exports = router;
