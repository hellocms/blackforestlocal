const DealerCategory = require('../models/DealerCategory');

exports.createDealerCategory = async (req, res) => {
  try {
    const { category_name, description, parent_category } = req.body;

    if (!category_name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if the parent category exists if provided
    if (parent_category) {
      const parent = await DealerCategory.findById(parent_category);
      if (!parent) {
        return res.status(400).json({ message: 'Parent category not found' });
      }
    }

    const existingCategory = await DealerCategory.findOne({ category_name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    const category = new DealerCategory({
      category_name,
      description,
      parent_category,
    });

    const savedCategory = await category.save();
    res.status(201).json({ message: 'Dealer category created successfully', category: savedCategory });
  } catch (error) {
    console.error('Error creating dealer category:', error);
    res.status(500).json({ message: 'Server error while creating dealer category', error: error.message });
  }
};

exports.getDealerCategories = async (req, res) => {
  try {
    const categories = await DealerCategory.find().populate('parent_category', 'category_name'); // Populate parent category name
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching dealer categories:', error);
    res.status(500).json({ message: 'Server error while fetching dealer categories', error: error.message });
  }
};

exports.getDealerCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await DealerCategory.findById(id).populate('parent_category', 'category_name');
    if (!category) {
      return res.status(404).json({ message: 'Dealer category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error('Error fetching dealer category:', error);
    res.status(500).json({ message: 'Server error while fetching dealer category', error: error.message });
  }
};

exports.updateDealerCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, description, parent_category } = req.body;

    if (!category_name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if the parent category exists if provided
    if (parent_category) {
      const parent = await DealerCategory.findById(parent_category);
      if (!parent) {
        return res.status(400).json({ message: 'Parent category not found' });
      }
    }

    const existingCategory = await DealerCategory.findOne({ category_name, _id: { $ne: id } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    const updatedCategory = await DealerCategory.findByIdAndUpdate(
      id,
      { category_name, description, parent_category, updated_at: Date.now() },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Dealer category not found' });
    }

    res.status(200).json({ message: 'Dealer category updated successfully', category: updatedCategory });
  } catch (error) {
    console.error('Error updating dealer category:', error);
    res.status(500).json({ message: 'Server error while updating dealer category', error: error.message });
  }
};

exports.deleteDealerCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await DealerCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Dealer category not found' });
    }

    // Check if the category has subcategories
    const hasSubcategories = await DealerCategory.findOne({ parent_category: id });
    if (hasSubcategories) {
      return res.status(400).json({ message: 'Cannot delete category with subcategories' });
    }

    const deletedCategory = await DealerCategory.findByIdAndDelete(id);
    res.status(200).json({ message: 'Dealer category deleted successfully' });
  } catch (error) {
    console.error('Error deleting dealer category:', error);
    res.status(500).json({ message: 'Server error while deleting dealer category', error: error.message });
  }
};