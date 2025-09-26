const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Company name cannot exceed 50 characters'],
    match: [/^[A-Za-z\s]+$/, 'Company name must contain only letters and spaces'],
  },
}, { timestamps: true });

// Case-insensitive unique index
CompanySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('Company', CompanySchema);