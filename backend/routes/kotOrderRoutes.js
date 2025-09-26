const express = require('express');
const router = express.Router();
const {
  createKotOrder,
  getKotOrder,
  getAllKotOrders,
} = require('../controllers/kotOrderController');

// Create a new KOT order
router.post('/', createKotOrder);

// Get a specific KOT order by form number
router.get('/:formNumber', getKotOrder);

// Get all KOT orders
router.get('/', getAllKotOrders);

module.exports = router;