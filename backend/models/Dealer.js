const mongoose = require('mongoose');

const dealerSchema = new mongoose.Schema({
  dealer_name: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  phone_no: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{10}$/, 'Phone number must be exactly 10 digits'],
    unique: true, // Enforce uniqueness on phone_no
  },
  gst: {
    type: String,
    trim: true,
    unique: true, // Enforce uniqueness on gst
  },
  pan: {
    type: String,
    trim: true,
  },
  msme: {
    type: String,
    trim: true,
  },
  tan: {
    type: String,
    trim: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Ensure unique indexes are applied



module.exports = mongoose.model('Dealer', dealerSchema);