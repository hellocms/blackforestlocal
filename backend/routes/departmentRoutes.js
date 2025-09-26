// Update routes/departmentRoutes.js (add GET single)
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const departmentController = require('../controllers/departmentController');

// Superadmin-only routes
router.post('/departments', auth(['superadmin']), departmentController.createDepartment);
router.get('/departments/list-departments', departmentController.getDepartments); // No auth for list, but frontend sends token
router.get('/departments/:id', auth(['superadmin']), departmentController.getDepartmentById); // New: GET single, protected
router.put('/departments/:id', auth(['superadmin']), departmentController.updateDepartment);
router.delete('/departments/:id', auth(['superadmin']), departmentController.deleteDepartment);

module.exports = router;