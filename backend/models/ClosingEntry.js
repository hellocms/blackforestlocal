const mongoose = require('mongoose');

const closingEntrySchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    systemSales: {
      type: Number,
      required: true,
      min: 0,
    },
    manualSales: {
      type: Number,
      required: true,
      min: 0,
    },
    onlineSales: {
      type: Number,
      required: true,
      min: 0,
    },
    expenses: {
      type: Number,
      required: true,
      min: 0,
    },
    expenseDetails: [
      {
        serialNo: {
          type: Number,
          required: true,
        },
        reason: {
          type: String,
          required: function () {
            return this.amount > 0;
          },
          trim: true,
        },
        recipient: {
          type: String,
          required: function () {
            return this.amount > 0;
          },
          trim: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    netResult: {
      type: Number,
      required: true,
    },
    creditCardPayment: {
      type: Number,
      required: true,
      min: 0,
    },
    upiPayment: {
      type: Number,
      required: true,
      min: 0,
    },
    cashPayment: {
      type: Number,
      required: true,
      min: 0,
    },
    denom2000: {
      type: Number,
      required: true,
      min: 0,
    },
    denom500: {
      type: Number,
      required: true,
      min: 0,
    },
    denom200: {
      type: Number,
      required: true,
      min: 0,
    },
    denom100: {
      type: Number,
      required: true,
      min: 0,
    },
    denom50: {
      type: Number,
      required: true,
      min: 0,
    },
    denom20: {
      type: Number,
      required: true,
      min: 0,
    },
    denom10: {
      type: Number,
      required: true,
      min: 0,
    },
    isFinalized: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClosingEntry', closingEntrySchema);