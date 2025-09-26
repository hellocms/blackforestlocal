const express = require('express');
const router = express.Router();
const dealerController = require('../controllers/dealerController');

router.post('/', dealerController.createDealer);
router.get('/', dealerController.getDealers);
router.get('/:id', dealerController.getDealerById); // Fetch dealer by ID
router.put('/:id', dealerController.updateDealer); // Update dealer by ID
router.delete('/:id', dealerController.deleteDealer);

module.exports = router;