const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // Optional parent category
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null }, // New: Optional department reference
  image: { type: String, default: null }, // Single image filename
  isPastryProduct: { type: Boolean, default: false }, // Pastry product flag
  isCake: { type: Boolean, default: false }, // Cake flag
  isBiling: { type: Boolean, default: false }, // Biling flag
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);