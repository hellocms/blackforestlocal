const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    required: true,
    enum: ['Credit - Deposit', 'Debit - Expense'],
  },
  source: {
    type: String,
    required: true,
    enum: ['IDFC 1', 'IDFC 2', 'IDFC 3', 'IDFC 4', 'CASH IN HAND', 'UPI', 'Credit Card'],
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  expenseCategory: {
    type: String,
    default: 'N/A',
  },
  remarks: {
    type: String,
    default: 'N/A',
  },
});

const financialSchema = new mongoose.Schema({
  idfc1Balance: {
    type: Number,
    default: 0,
  },
  idfc2Balance: {
    type: Number,
    default: 0,
  },
  idfc3Balance: {
    type: Number,
    default: 0,
  },
  idfc4Balance: {
    type: Number,
    default: 0,
  },
  branchBalances: [{
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    cashBalance: {
      type: Number,
      default: 0,
    },
  }],
  totalCashBalance: {
    type: Number,
    default: 0,
  },
  transactions: [transactionSchema],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Financial', financialSchema);