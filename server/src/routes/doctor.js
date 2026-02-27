const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const auth = require('../middleware/auth');

// All routes are role protected for 'doctor' and 'admin'
router.get('/dashboard-summary', auth(), doctorController.getDashboardSummary);
router.get('/patients', auth(), doctorController.getPatients);
router.get('/patient/:id', auth(), doctorController.getPatientById);
router.get('/patient/:id/vitals-history', auth(), doctorController.getVitalsHistory);
router.get('/patient/:id/prescriptions', auth(), doctorController.getPrescriptionsHistory);

module.exports = router;
