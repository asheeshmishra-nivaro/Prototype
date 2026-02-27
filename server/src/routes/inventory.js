const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const auth = require('../middleware/auth');

// Doctors and Admins can search medicine
router.get('/search', auth(['doctor', 'admin']), inventoryController.searchMedicines);

// Operators and Admins can see stock
router.get('/balance', auth(['operator', 'admin']), inventoryController.getStockBalance);

// Operators update stock after dispensing
router.post('/update', auth(['operator']), inventoryController.updateStock);

// Admins set pricing
router.post('/pricing', auth(['admin']), inventoryController.setPricing);

module.exports = router;
