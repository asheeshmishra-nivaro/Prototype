const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const validateVitals = require('../middleware/validationMiddleware');
const auth = require('../middleware/auth');

// Operator Workflow
// POST - Start consultation with mandatory vitals validation
router.post('/start', auth(['operator']), validateVitals, consultationController.startConsultation);

// Doctor Workflow
// GET - View consultations assigned to specific doctor
router.get('/queue', auth(['doctor']), consultationController.getDoctorQueue);

// POST - Save prescription (Validated by RX logic)
router.post('/prescription', auth(['doctor']), consultationController.savePrescription);

module.exports = router;
