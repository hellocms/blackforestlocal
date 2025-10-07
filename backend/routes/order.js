const express = require('express');
const router = express.Router();
const { createOrder, getAllOrders, updateSendingQty, deleteOrder } = require('../controllers/orderController');
const auth = require('../middleware/auth');

router.post('/', auth(['branch']), createOrder);
router.get('/', auth(['admin', 'superadmin', 'branch']), getAllOrders);
router.patch('/:id', auth(['admin', 'superadmin', 'branch']), updateSendingQty);
router.delete('/:id', auth(['admin', 'superadmin', 'branch']), deleteOrder);

module.exports = router;