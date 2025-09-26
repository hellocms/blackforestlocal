const express = require('express');
const router = express.Router();
const { createOrder, getAllOrders, updateSendingQty } = require('../controllers/orderController');
const auth = require('../middleware/auth');

router.post('/', auth(['branch']), createOrder);
router.get('/', auth(['admin', 'superadmin','branch']), getAllOrders);
router.patch('/:id', auth(['admin', 'superadmin','branch']), updateSendingQty);

module.exports = router;