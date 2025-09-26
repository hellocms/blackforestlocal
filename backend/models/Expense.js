const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  bill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DealerBill', // Must match the model name
    required: true,
  },
  paid: {
    type: Number,
    default: 0,
    min: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

expenseSchema.virtual('pending').get(function () {
  return this.bill && this.bill.amount ? this.bill.amount - this.paid : 0;
});

expenseSchema.virtual('status').get(function () {
  return this.pending > 0 ? 'Pending' : 'Completed';
});

expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

expenseSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

expenseSchema.pre(/^find/, function (next) {
  this.populate('bill', 'billNumber amount');
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);