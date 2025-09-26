const mongoose = require('mongoose');

const dealerProductSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DealerCategory',
    required: true,
  },
  barcode_no: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    min: 0,
  },
  stock_quantity: {
    type: Number,
    min: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
  },
});



module.exports = mongoose.model('DealerProduct', dealerProductSchema);