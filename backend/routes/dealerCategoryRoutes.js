const express = require('express');
const router = express.Router();
const dealerCategoryController = require('../controllers/dealerCategoryController');

router.post('/', dealerCategoryController.createDealerCategory);
router.get('/', dealerCategoryController.getDealerCategories);
router.get('/:id', dealerCategoryController.getDealerCategoryById);
router.put('/:id', dealerCategoryController.updateDealerCategory);
router.delete('/:id', dealerCategoryController.deleteDealerCategory);

module.exports = router;