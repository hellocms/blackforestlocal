const mongoose = require('mongoose');

const dailyAssignmentsSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  date: {
    type: String, // Store date as string in "YYYY-MM-DD" format (e.g., "2025-03-03")
    required: true,
  },
  cashierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null, // Initially null until assigned
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null, // Initially null until assigned
  },
});

// Ensure uniqueness for branchId and date combination
dailyAssignmentsSchema.index({ branchId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyAssignments', dailyAssignmentsSchema);