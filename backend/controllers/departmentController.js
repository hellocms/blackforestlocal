// controllers/departmentController.js
const Department = require('../models/Department');
const Category = require('../models/Category'); // Import for delete check

// Create Department
exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) return res.status(400).json({ message: 'Department name already exists' });

    const department = new Department({
      name,
    });

    await department.save();
    res.status(201).json({ message: '✅ Department created successfully', department });
  } catch (error) {
    console.error('❌ Error creating department:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Get All Departments
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.status(200).json(departments);
  } catch (error) {
    console.error('❌ Error fetching departments:', error);
    res.status(500).json({ message: 'Error fetching departments', error: error.message });
  }
};

// Get Single Department by ID
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.status(200).json(department);
  } catch (error) {
    console.error('❌ Error fetching department:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Update Department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const department = await Department.findById(id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    const existingDepartment = await Department.findOne({ name, _id: { $ne: id } });
    if (existingDepartment) return res.status(400).json({ message: 'Department name already exists' });

    department.name = name || department.name;

    await department.save();
    res.status(200).json({ message: '✅ Department updated successfully', department });
  } catch (error) {
    console.error('❌ Error updating department:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Delete Department
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    // Check if department is referenced by any categories
    const linkedCategories = await Category.find({ department: id });
    if (linkedCategories.length > 0) {
      return res.status(400).json({ message: 'Cannot delete department with linked categories' });
    }

    await Department.findByIdAndDelete(id);
    res.status(200).json({ message: '✅ Department deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting department:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

module.exports = {
  createDepartment: exports.createDepartment,
  getDepartments: exports.getDepartments,
  getDepartmentById: exports.getDepartmentById,
  updateDepartment: exports.updateDepartment,
  deleteDepartment: exports.deleteDepartment,
};