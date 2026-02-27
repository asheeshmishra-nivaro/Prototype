const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const auth = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/doctors', auth(['operator']), authController.getDoctors);

module.exports = router;
