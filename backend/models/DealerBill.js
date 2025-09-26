const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  billNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  billDate: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  billImage: {
    type: String,
    required: true,
  },
  paid: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  pending: {
    type: Number,
    required: true,
    default: function() { return this.amount; },
    min: 0,
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    required: true,
    default: 'Pending',
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

billSchema.pre('save', function(next) {
  if (this.isModified('paid')) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('DealerBill', billSchema);