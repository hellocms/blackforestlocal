const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const employeeController = require('../controllers/employeeController');

// Superadmin/Admin-only routes
router.get('/employees', auth(['superadmin', 'admin', 'branch']), employeeController.getEmployees);
router.post('/employees', auth(['superadmin', 'admin']), employeeController.createEmployee);
router.put('/employees/:id', auth(['superadmin', 'admin']), employeeController.updateEmployee);
router.delete('/employees/:id', auth(['superadmin', 'admin']), employeeController.deleteEmployee);
router.put('/employees/:id/status', auth(['superadmin', 'admin']), employeeController.toggleEmployeeStatus); // ✅ Added

module.exports = router;