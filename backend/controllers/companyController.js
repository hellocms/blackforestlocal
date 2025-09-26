const Company = require('../models/Company');

// Create a new company
exports.createCompany = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    // Check for existing company (case-insensitive handled by schema index)
    const existingCompany = await Company.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCompany) {
      return res.status(400).json({ message: 'Company already exists' });
    }

    const company = new Company({ name });
    await company.save();
    res.status(201).json(company);
  } catch (error) {
    console.error('❌ Error creating company:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Company already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all companies
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.status(200).json(companies);
  } catch (error) {
    console.error('❌ Error fetching companies:', error);
    res.status(500).json({ message: 'Server error' });
  }
};