const Employee = require('../models/Employee');
const Order = require('../models/Order'); // Assume an Orders model exists
const multer = require('multer');
const { put, del } = require('@vercel/blob');

// Configure multer for two uploads (Aadhaar and photo) to memory (for Vercel Blob)
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'aadhaar', maxCount: 1 }, // Optional Aadhaar
  { name: 'photo', maxCount: 1 },   // Required photo
]);

// Get All Employees with optional team filter
exports.getEmployees = async (req, res) => {
  try {
    const { team } = req.query; // Get the team query parameter (e.g., "Cashier", "Manager")
    let query = {};

    // Add team filter if provided
    if (team) {
      query.team = team; // Filter employees by team (e.g., { team: "Cashier" })
    }

    const employees = await Employee.find(query);
    res.status(200).json(employees);
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
};

// Create Employee
exports.createEmployee = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ message: 'File upload error', error: err });

    try {
      const { name, phoneNumber, address, team } = req.body;
      let aadhaar = null;
      let photo = null;

      if (req.files['aadhaar']) {
        const blob = await put(`uploads/employees/aadhaar/${Date.now()}-${req.files['aadhaar'][0].originalname}`, req.files['aadhaar'][0].buffer, { access: 'public' });
        aadhaar = blob.url;
      }
      if (req.files['photo']) {
        const blob = await put(`uploads/employees/${Date.now()}-${req.files['photo'][0].originalname}`, req.files['photo'][0].buffer, { access: 'public' });
        photo = blob.url;
      }

      if (!photo) return res.status(400).json({ message: 'Photo is required' });

      const existingPhone = await Employee.findOne({ phoneNumber });
      if (existingPhone) return res.status(400).json({ message: 'Phone number already exists' });

      const employee = new Employee({
        name,
        phoneNumber,
        address,
        team,
        aadhaar,
        photo,
      });

      await employee.save();
      console.log('Created Employee with ID:', employee.employeeId); // Debug log to confirm ID
      res.status(201).json({ message: '✅ Employee created successfully', employee });
    } catch (error) {
      console.error('❌ Error creating employee:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
};

// Update Employee
exports.updateEmployee = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ message: 'File upload error', error: err });

    try {
      const { id } = req.params;
      const { name, phoneNumber, address, team, status } = req.body;
      let aadhaar = null;
      let photo = null;

      if (req.files['aadhaar']) {
        const blob = await put(`uploads/employees/aadhaar/${Date.now()}-${req.files['aadhaar'][0].originalname}`, req.files['aadhaar'][0].buffer, { access: 'public' });
        aadhaar = blob.url;
      }
      if (req.files['photo']) {
        const blob = await put(`uploads/employees/${Date.now()}-${req.files['photo'][0].originalname}`, req.files['photo'][0].buffer, { access: 'public' });
        photo = blob.url;
      }

      const employee = await Employee.findById(id);
      if (!employee) return res.status(404).json({ message: 'Employee not found' });

      // Check for phone number uniqueness (exclude self)
      if (phoneNumber && phoneNumber !== employee.phoneNumber) {
        const existingPhone = await Employee.findOne({ phoneNumber, _id: { $ne: id } });
        if (existingPhone) return res.status(400).json({ message: 'Phone number already exists' });
      }

      // Delete old files from Blob if new ones are uploaded
      if (req.files['aadhaar'] && employee.aadhaar) {
        try {
          await del(employee.aadhaar);
        } catch (deleteError) {
          console.error('Error deleting old Aadhaar from Blob:', deleteError);
        }
      }
      if (req.files['photo'] && employee.photo) {
        try {
          await del(employee.photo);
        } catch (deleteError) {
          console.error('Error deleting old photo from Blob:', deleteError);
        }
      }

      employee.name = name || employee.name;
      employee.phoneNumber = phoneNumber || employee.phoneNumber;
      employee.address = address || employee.address;
      employee.team = team || employee.team;
      employee.status = status || employee.status;
      employee.aadhaar = aadhaar || employee.aadhaar;
      employee.photo = photo || employee.photo;

      await employee.save();
      res.status(200).json({ message: '✅ Employee updated successfully', employee });
    } catch (error) {
      console.error('❌ Error updating employee:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
};

// Toggle Employee Status
exports.toggleEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    employee.status = employee.status === 'Active' ? 'Inactive' : 'Active';
    await employee.save();

    res.status(200).json({ 
      message: `✅ Employee ${employee.status.toLowerCase()}d successfully`, 
      employee 
    });
  } catch (error) {
    console.error('❌ Error toggling employee status:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Delete Employee with 30-Day Billing Check
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Check for billing activity in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await Order.find({
      $or: [{ employeeId: employee.employeeId }, { 'employeeName': employee.name }], // Adjust based on your Orders schema
      createdAt: { $gte: thirtyDaysAgo },
    });

    if (recentOrders.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete employee with billing activity within the last 30 days' 
      });
    }

    // Delete associated files from Blob if they exist
    if (employee.aadhaar) {
      try {
        await del(employee.aadhaar);
      } catch (deleteError) {
        console.error('Error deleting Aadhaar from Blob:', deleteError);
      }
    }
    if (employee.photo) {
      try {
        await del(employee.photo);
      } catch (deleteError) {
        console.error('Error deleting photo from Blob:', deleteError);
      }
    }

    await Employee.findByIdAndDelete(id);
    res.status(200).json({ message: '✅ Employee deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting employee:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

module.exports = {
  getEmployees: exports.getEmployees,
  createEmployee: exports.createEmployee,
  updateEmployee: exports.updateEmployee,
  toggleEmployeeStatus: exports.toggleEmployeeStatus,
  deleteEmployee: exports.deleteEmployee,
};