const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Existing routes
router.post('/produce', inventoryController.produceStock);
router.get('/', inventoryController.getInventory);
router.put('/:id/stock', inventoryController.updateStock);
router.put('/:id/threshold', inventoryController.updateThreshold);
router.post('/reduce', inventoryController.reduceStockEndpoint);

// Add the new transfer route
router.post('/transfer', inventoryController.transferStock);

module.exports = router;