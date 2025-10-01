const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }], // Changed to array
  image: { type: String, default: null },
  isPastryProduct: { type: Boolean, default: false },
  isCake: { type: Boolean, default: false },
  isBiling: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);