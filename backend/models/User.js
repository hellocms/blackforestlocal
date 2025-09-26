const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  role: { type: String, enum: ['admin', 'superadmin', 'branch', 'accounts', 'deliveryboy'], required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: function() { return this.role === 'branch'; } },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);