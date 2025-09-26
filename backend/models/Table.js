const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: true, // e.g., "Floor-1", "Balcony-1"
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TableCategory',
    required: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  status: {
    type: String,
    enum: ['Free', 'Occupied'],
    default: 'Free',
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null, // Reference to the active order for this table
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Table', tableSchema);