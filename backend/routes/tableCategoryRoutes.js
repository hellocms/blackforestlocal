const express = require('express');
const router = express.Router();
const { createTableCategory, getTableCategories, updateTableCategory } = require('../controllers/tableCategoryController');

router.post('/', createTableCategory);
router.get('/', getTableCategories);
router.put('/:id', updateTableCategory); // New endpoint for updating table count

module.exports = router;