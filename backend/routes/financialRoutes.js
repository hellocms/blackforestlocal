const express = require('express');
const router = express.Router();
const {
  getBalances,
  getTransactions,
  recordDeposit,
  recordExpense,
} = require('../controllers/financialController');

console.log('✅ financialRoutes.js loaded');

// Financial Management Routes
router.get('/balances', getBalances);
router.get('/transactions', getTransactions);
router.post('/deposit', (req, res, next) => {
  console.log('📥 Received POST request to /api/financial/deposit');
  recordDeposit(req, res, next);
});
router.post('/expense', recordExpense);

module.exports = router;