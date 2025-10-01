const Category = require('../models/Category');
const Department = require('../models/Department');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/categories directory exists
const uploadDir = path.join(__dirname, '../Uploads/categories');
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
      const { name, parent, departments, isPastryProduct, isCake, isBiling } = req.body;
      console.log('Uploaded File:', req.file);
      const image = req.file ? path.join('Uploads/categories', req.file.filename) : null;

      const existingCategory = await Category.findOne({ name });
      if (existingCategory) return res.status(400).json({ message: 'Category name already exists' });

      if (parent) {
        const parentExists = await Category.findById(parent);
        if (!parentExists) return res.status(404).json({ message: 'Parent category not found' });
      }

      let departmentIds = [];
      if (departments && departments !== 'null') {
        try {
          departmentIds = JSON.parse(departments);
          if (!Array.isArray(departmentIds)) {
            return res.status(400).json({ message: 'Departments must be an array' });
          }
          for (const deptId of departmentIds) {
            const deptExists = await Department.findById(deptId);
            if (!deptExists) return res.status(404).json({ message: `Department ${deptId} not found` });
          }
        } catch (error) {
          return res.status(400).json({ message: 'Invalid departments format', error: error.message });
        }
      }

      const category = new Category({
        name,
        parent: parent || null,
        departments: departmentIds.length > 0 ? departmentIds : [],
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
    const typeFilter = req.query.type;
    const departmentId = req.query.departmentId;

    let query = Category.find();
    if (typeFilter === 'pastry') {
      query = query.where('isPastryProduct').equals(true);
    } else if (typeFilter === 'cake') {
      query = query.where('isCake').equals(true);
    } else if (typeFilter === 'biling') {
      query = query.where('isBiling').equals(true);
    }
    if (departmentId) {
      query = query.where('departments').in([departmentId]);
    }

    const categories = await query.populate('parent', 'name').populate('departments', 'name').lean();

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
      const { name, parent, departments, isPastryProduct, isCake, isBiling } = req.body;
      const image = req.file ? path.join('Uploads/categories', req.file.filename) : null;

      const category = await Category.findById(id);
      if (!category) return res.status(404).json({ message: 'Category not found' });

      const existingCategory = await Category.findOne({ name, _id: { $ne: id } });
      if (existingCategory) return res.status(400).json({ message: 'Category name already exists' });

      if (parent && parent !== 'null') {
        const parentExists = await Category.findById(parent);
        if (!parentExists) return res.status(404).json({ message: 'Parent category not found' });
        if (parent === id) return res.status(400).json({ message: 'Category cannot be its own parent' });
      }

      let departmentIds = [];
      if (departments && departments !== 'null') {
        try {
          departmentIds = JSON.parse(departments);
          if (!Array.isArray(departmentIds)) {
            return res.status(400).json({ message: 'Departments must be an array' });
          }
          for (const deptId of departmentIds) {
            const deptExists = await Department.findById(deptId);
            if (!deptExists) return res.status(404).json({ message: `Department ${deptId} not found` });
          }
        } catch (error) {
          return res.status(400).json({ message: 'Invalid departments format', error: error.message });
        }
      }

      if (image && category.image) {
        const oldImagePath = path.join(__dirname, '..', category.image);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error('Error deleting old image:', err);
        });
      }

      category.name = name || category.name;
      category.parent = parent && parent !== 'null' ? parent : null;
      category.departments = departmentIds.length > 0 ? departmentIds : [];
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

    const childCategories = await Category.find({ parent: id });
    if (childCategories.length > 0) {
      return res.status(400).json({ message: 'Cannot delete category with subcategories' });
    }

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