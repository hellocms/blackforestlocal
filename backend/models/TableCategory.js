const mongoose = require('mongoose');

const tableCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // e.g., "Floor", "Balcony", "AC", "Non-AC"
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  tableCount: {
    type: Number,
    required: true, // Number of tables in this category
    min: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('TableCategory', tableCategorySchema);