const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// Create a new expense entry
router.post('/', expenseController.createExpense);

// Get all expense entries
router.get('/', expenseController.getExpenses);

// Get a specific expense entry by ID
router.get('/:id', expenseController.getExpenseById);

// Update an expense entry by ID
router.put('/:id', expenseController.updateExpense);

module.exports = router;