const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null }, // null for factory
  inStock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  stockHistory: [
    {
      date: { type: Date, default: Date.now },
      change: { type: Number, required: true },
      reason: { type: String },
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Inventory', InventorySchema);