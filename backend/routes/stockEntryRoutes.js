const express = require('express');
const router = express.Router();
const stockEntryController = require('../controllers/stockEntryController');

router.post('/', stockEntryController.createStockEntry);
router.get('/', stockEntryController.getStockEntries);
router.get('/:id', stockEntryController.getStockEntryById);
router.put('/:id', stockEntryController.updateStockEntry);
router.delete('/:id', stockEntryController.deleteStockEntry);

module.exports = router;