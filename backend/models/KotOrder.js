const mongoose = require('mongoose');

const KotOrderSchema = new mongoose.Schema({
  formNumber: {
    type: String,
    unique: true,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  orderTime: {
    type: String,
    required: true,
  },
  deliveryDate: {
    type: Date,
    required: true,
  },
  deliveryTime: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerNumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  birthdayDate: {
    type: Date,
  },
  cakeModel: {
    type: String,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  flavour: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  alteration: {
    type: String,
  },
  specialCare: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  advance: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  branch: {
    type: String,
    required: true,
    enum: [
      'Chidambaram Nagar',
      'VVD Signal',
      'Ettayapuram Road',
      'Antony Church',
      'Sawyie-Puram',
      'Karunai College',
      '3rd Mile',
    ],
  },
  salesMan: {
    type: String,
    required: true,
  },
  deliveryType: {
    type: String,
    required: true,
    enum: ['In-Store Pickup', 'Door Delivery'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('KotOrder', KotOrderSchema);