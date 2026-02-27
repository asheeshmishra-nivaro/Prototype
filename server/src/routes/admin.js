const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const rbacController = require('../controllers/rbacController');
const inventoryController = require('../controllers/inventoryController');
const auth = require('../middleware/auth');
const activityLogger = require('../middleware/activityLogger');

router.use(activityLogger);

// Strategic Monitoring
router.get('/dashboard-summary', auth(['admin', 'super_admin']), adminController.getDashboardSummary);
router.get('/inventory-control', auth(['admin', 'super_admin']), adminController.getInventoryControl);
router.get('/audit-feed', auth(['admin', 'super_admin']), adminController.getAuditFeed);

// Enterprise Inventory Governance
router.get('/inventory/dashboard', auth(['admin', 'super_admin']), inventoryController.getInventoryDashboard);
router.get('/inventory/list', auth(['admin', 'super_admin']), inventoryController.getInventoryList);
router.post('/inventory/transfer', auth(['admin', 'super_admin']), inventoryController.processTransfer);
router.post('/inventory/reconcile', auth(['admin', 'super_admin']), inventoryController.processReconciliation);
router.get('/inventory/ledger', auth(['admin', 'super_admin']), inventoryController.getMovementLedger);

// Enterprise RBAC & User Management
router.get('/users', auth(['admin', 'super_admin']), rbacController.getUserManagement);
router.post('/users/create', auth(['admin', 'super_admin']), rbacController.createUser);
router.post('/users/bulk-suspend', auth(['admin', 'super_admin']), rbacController.bulkSuspendUsers);
router.get('/users/export', auth(['admin', 'super_admin']), rbacController.exportUserCSV);

router.get('/roles', auth(['admin', 'super_admin']), rbacController.getRolesHierarchy);
router.get('/permissions', auth(['admin', 'super_admin']), rbacController.getPermissions);

router.get('/templates', auth(['admin', 'super_admin']), rbacController.getRuleTemplates);
router.post('/templates/apply', auth(['admin', 'super_admin']), rbacController.applyTemplate);

router.get('/security-logs', auth(['admin', 'super_admin']), rbacController.getDetailedActivityLogs);
router.get('/analytics/roles', auth(['admin', 'super_admin']), rbacController.getRoleDistribution);

// System Reset
router.post('/reset-demo', auth(['admin', 'super_admin']), adminController.resetDemo);

module.exports = router;
