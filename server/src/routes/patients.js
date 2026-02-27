const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const auth = require('../middleware/auth');

// Only operators can register patients
router.post('/register', auth(['operator']), patientController.registerPatient);

// Operators and Doctors can search
router.get('/search/:phone', auth(['operator', 'doctor']), patientController.searchPatientByPhone);

// History
router.get('/:id/history', auth(['operator', 'doctor']), patientController.getPatientHistory);

module.exports = router;
