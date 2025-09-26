const mongoose = require('mongoose');

const BranchSchema = new mongoose.Schema({
  branchId: { type: String, required: true, unique: true }, // e.g., B001
  name: { type: String, required: true }, // e.g., Branch 1
  address: { type: String, required: true }, // e.g., 123 Main St
  phoneNo: { type: String, required: true }, // e.g., 555-1234
  emailId: { type: String, required: true }, // e.g., branch1@example.com
}, { timestamps: true });

module.exports = mongoose.model('Branch', BranchSchema);