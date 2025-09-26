const mongoose = require('mongoose');

const dealerCategorySchema = new mongoose.Schema({
  category_name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  parent_category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DealerCategory', // Reference to the same model for self-referencing
    default: null, // Null for top-level categories
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
  },
});



module.exports = mongoose.model('DealerCategory', dealerCategorySchema);