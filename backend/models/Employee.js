const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true }, // Make optional during creation, required via hook
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true }, // 10-digit phone
  address: { type: String, required: true },
  team: { 
    type: String, 
    required: true, 
    enum: ['Waiter', 'Chef', 'Cashier', 'Manager'] 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['Active', 'Inactive'], 
    default: 'Active' 
  }, // Active/Inactive status
  aadhaar: { type: String, default: null }, // Path to Aadhaar file (optional)
  photo: { type: String, required: true }, // Path to photo file
}, { timestamps: true });

// Pre-save hook to generate employeeId if not set (starts from 1)
EmployeeSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const lastEmployee = await this.constructor.findOne().sort({ employeeId: -1 });
    const lastId = lastEmployee ? parseInt(lastEmployee.employeeId.replace('E', '')) : 0;
    this.employeeId = `E${(lastId + 1).toString().padStart(3, '0')}`; // E001, E002, etc.
  }
  next();
});

module.exports = mongoose.model('Employee', EmployeeSchema);