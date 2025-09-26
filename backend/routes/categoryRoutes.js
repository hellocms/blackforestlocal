const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

// Superadmin-only routes
router.post('/categories', auth(['superadmin']), categoryController.createCategory);
router.get('/categories/list-categories' , categoryController.getCategories);
router.put('/categories/:id', auth(['superadmin']), categoryController.updateCategory);
router.delete('/categories/:id', auth(['superadmin']), categoryController.deleteCategory); // ✅ Added

module.exports = router;