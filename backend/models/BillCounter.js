const mongoose = require('mongoose');

const billCounterSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  date: {
    type: String, // Store date as string in "YYYY-MM-DD" format (e.g., "2025-03-03")
    required: true,
  },
  count: {
    type: Number,
    default: 1, // Start at 1 for each new day
  },
});

// Ensure uniqueness for branchId and date combination
billCounterSchema.index({ branchId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('BillCounter', billCounterSchema);