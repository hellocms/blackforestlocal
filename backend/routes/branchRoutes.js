const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const branchController = require('../controllers/branchController');

// Superadmin-only routes
router.get('/branches', auth(['superadmin']), branchController.getBranches);
router.post('/branches', auth(['superadmin']), branchController.addBranch);
router.put('/branches/:id', auth(['superadmin']), branchController.updateBranch);

// New public endpoint for general access
router.get('/branches/public', branchController.getBranchesPublic);

// Branch-only routes
router.get('/branch/:branchId/products', auth(['branch']), branchController.getBranchProducts);
router.post('/branch/orders/:type', auth(['branch']), branchController.placeOrder);
router.post('/branch/returns', auth(['branch']), branchController.submitReturn);
router.get('/branch/:branchId/categories', auth(['branch']), branchController.getCategories);

module.exports = router;