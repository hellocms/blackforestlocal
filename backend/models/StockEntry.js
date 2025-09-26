const mongoose = require('mongoose');

const stockEntrySchema = new mongoose.Schema({
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DealerCategory',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DealerProduct',
    required: true,
  },
  pcs_count: {
    type: Number,
    required: true,
    min: 1, // Must be a positive integer
  },
  amount: {
    type: Number,
    required: true,
    min: 0, // Must be a positive number
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
  },
});

module.exports = mongoose.model('StockEntry', stockEntrySchema);