const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');

// Existing POST route
router.post('/', billController.createBill);

// Existing GET route to list all bills
router.get('/', billController.getBills);

// Existing GET route to fetch a specific bill by ID
router.get('/:id', billController.getBillById);

// Existing PUT route to update a specific bill by ID
router.put('/:id', billController.updateBill);

module.exports = router;