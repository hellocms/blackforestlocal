const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const inventoryController = require('../controllers/inventoryController'); // New controller

// Product Routes (metadata only)
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);
router.delete('/products/:id', productController.deleteProduct);

// Inventory Routes (stock management)
router.post('/inventory/produce', inventoryController.produceStock);
router.get('/inventory', inventoryController.getInventory);
router.put('/inventory/:id/stock', inventoryController.updateStock);
router.put('/inventory/:id/threshold', inventoryController.updateThreshold);
router.get('/branches', inventoryController.getBranches); // For UI dropdown

module.exports = router;