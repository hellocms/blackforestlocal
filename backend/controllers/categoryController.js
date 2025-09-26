const Category = require('../models/Category');
const Department = require('../models/Department'); // New: Import for validation
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/categories directory exists
const uploadDir = path.join(__dirname, '../uploads/categories');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for single image upload to uploads/categories
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage }).single('image');

// Create Category
exports.createCategory = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ message: 'File upload error', error: err });

    try {
      const { name, parent, department, isPastryProduct, isCake, isBiling } = req.body; // Updated: Include department
      console.log('Uploaded File:', req.file);
      const image = req.file ? path.join('uploads/categories', req.file.filename) : null;

      const existingCategory = await Category.findOne({ name });
      if (existingCategory) return res.status(400).json({ message: 'Category name already exists' });

      if (parent) {
        const parentExists = await Category.findById(parent);
        if (!parentExists) return res.status(404).json({ message: 'Parent category not found' });
      }

      // New: Validate department if provided
      if (department && department !== 'null') {
        const deptExists = await Department.findById(department);
        if (!deptExists) return res.status(404).json({ message: 'Department not found' });
      }

      const category = new Category({
        name,
        parent: parent || null,
        department: department && department !== 'null' ? department : null, // New: Set department
        image,
        isPastryProduct: isPastryProduct === 'true' || isPastryProduct === true,
        isCake: isCake === 'true' || isCake === true,
        isBiling: isBiling === 'true' || isBiling === true,
      });

      await category.save();
      res.status(201).json({ message: '✅ Category created successfully', category });
    } catch (error) {
      console.error('❌ Error creating category:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
};

// Get All Categories
exports.getCategories = async (req, res) => {
  try {
    // Updated: Populate both parent and department
    const categories = await Category.find().populate('parent', 'name').populate('department', 'name');
    res.status(200).json(categories);
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Update Category
exports.updateCategory = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ message: 'File upload error', error: err });

    try {
      const { id } = req.params;
      const { name, parent, department, isPastryProduct, isCake, isBiling } = req.body; // Updated: Include department
      const image = req.file ? path.join('uploads/categories', req.file.filename) : null;

      const category = await Category.findById(id);
      if (!category) return res.status(404).json({ message: 'Category not found' });

      const existingCategory = await Category.findOne({ name, _id: { $ne: id } });
      if (existingCategory) return res.status(400).json({ message: 'Category name already exists' });

      if (parent && parent !== 'null') {
        const parentExists = await Category.findById(parent);
        if (!parentExists) return res.status(404).json({ message: 'Parent category not found' });
        if (parent === id) return res.status(400).json({ message: 'Category cannot be its own parent' });
      }

      // New: Validate department if provided
      if (department && department !== 'null') {
        const deptExists = await Department.findById(department);
        if (!deptExists) return res.status(404).json({ message: 'Department not found' });
      }

      if (image && category.image) {
        const oldImagePath = path.join(__dirname, '..', category.image);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error('Error deleting old image:', err);
        });
      }

      category.name = name || category.name;
      category.parent = parent && parent !== 'null' ? parent : null;
      category.department = department && department !== 'null' ? department : null; // New: Update department
      category.image = image || category.image;
      category.isPastryProduct = isPastryProduct !== undefined ? (isPastryProduct === 'true' || isPastryProduct === true) : category.isPastryProduct;
      category.isCake = isCake !== undefined ? (isCake === 'true' || isCake === true) : category.isCake;
      category.isBiling = isBiling !== undefined ? (isBiling === 'true' || isBiling === true) : category.isBiling;

      await category.save();
      res.status(200).json({ message: '✅ Category updated successfully', category });
    } catch (error) {
      console.error('❌ Error updating category:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
};

// Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Check if category is a parent to others (optional restriction)
    const childCategories = await Category.find({ parent: id });
    if (childCategories.length > 0) {
      return res.status(400).json({ message: 'Cannot delete category with subcategories' });
    }

    // Delete image if exists
    if (category.image) {
      const imagePath = path.join(__dirname, '..', category.image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting image:', err);
      });
    }

    await Category.findByIdAndDelete(id);
    res.status(200).json({ message: '✅ Category deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

module.exports = {
  createCategory: exports.createCategory,
  getCategories: exports.getCategories,
  updateCategory: exports.updateCategory,
  deleteCategory: exports.deleteCategory,
};