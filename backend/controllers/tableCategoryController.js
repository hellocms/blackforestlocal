const TableCategory = require('../models/TableCategory');
const Table = require('../models/Table');
const Branch = require('../models/Branch');

// Create a new table category and generate tables
const createTableCategory = async (req, res) => {
  try {
    const { name, branchId, tableCount } = req.body;

    // Validate required fields
    if (!name || !branchId || !tableCount) {
      return res.status(400).json({ message: 'Name, branchId, and tableCount are required' });
    }

    // Validate tableCount
    if (tableCount < 1) {
      return res.status(400).json({ message: 'Table count must be at least 1' });
    }

    // Validate branchId
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Check if category already exists for this branch
    const existingCategory = await TableCategory.findOne({ name, branchId });
    if (existingCategory) {
      return res.status(400).json({ message: 'Table category with this name already exists for this branch' });
    }

    // Create the table category
    const tableCategory = new TableCategory({
      name,
      branchId,
      tableCount,
    });
    await tableCategory.save();

    // Generate tables for the category
    const tables = [];
    for (let i = 1; i <= tableCount; i++) {
      const table = new Table({
        tableNumber: `${name}-${i}`, // e.g., "Floor-1"
        categoryId: tableCategory._id,
        branchId,
        status: 'Free',
      });
      tables.push(table);
    }
    await Table.insertMany(tables);

    // Populate the category with tables for the response
    const populatedCategory = await TableCategory.findById(tableCategory._id).populate('branchId');
    const createdTables = await Table.find({ categoryId: tableCategory._id });

    res.status(201).json({
      message: 'Table category created successfully',
      category: populatedCategory,
      tables: createdTables,
    });
  } catch (error) {
    console.error('Error creating table category:', error);
    res.status(500).json({ message: 'Error creating table category', error: error.message });
  }
};

// Get all table categories for a branch
const getTableCategories = async (req, res) => {
  try {
    const { branchId } = req.query;

    // Validate branchId
    if (!branchId) {
      return res.status(400).json({ message: 'branchId is required' });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Fetch all table categories for the branch
    const categories = await TableCategory.find({ branchId });

    // Fetch tables for each category
    const categoriesWithTables = await Promise.all(
      categories.map(async (category) => {
        const tables = await Table.find({ categoryId: category._id })
          .populate('currentOrder');
        return {
          ...category._doc,
          tables,
        };
      })
    );

    res.status(200).json({ categories: categoriesWithTables });
  } catch (error) {
    console.error('Error fetching table categories:', error);
    res.status(500).json({ message: 'Error fetching table categories', error: error.message });
  }
};

// Update table category (increase/decrease table count)
const updateTableCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { tableCount } = req.body;

    // Validate tableCount
    if (!tableCount || tableCount < 1) {
      return res.status(400).json({ message: 'Table count must be at least 1' });
    }

    // Find the table category
    const tableCategory = await TableCategory.findById(id);
    if (!tableCategory) {
      return res.status(404).json({ message: 'Table category not found' });
    }

    const currentTableCount = tableCategory.tableCount;
    tableCategory.tableCount = tableCount;
    await tableCategory.save();

    // Fetch existing tables for this category
    const existingTables = await Table.find({ categoryId: id }).sort('tableNumber');

    if (tableCount > currentTableCount) {
      // Increase: Add new tables
      const tablesToAdd = [];
      for (let i = currentTableCount + 1; i <= tableCount; i++) {
        const newTable = new Table({
          tableNumber: `${tableCategory.name}-${i}`,
          categoryId: tableCategory._id,
          branchId: tableCategory.branchId,
          status: 'Free',
        });
        tablesToAdd.push(newTable);
      }
      await Table.insertMany(tablesToAdd);
    } else if (tableCount < currentTableCount) {
      // Decrease: Remove excess tables
      const tablesToRemove = existingTables.slice(tableCount); // Tables to be removed
      const occupiedTables = tablesToRemove.filter(table => table.status === 'Occupied' || table.currentOrder);

      if (occupiedTables.length > 0) {
        return res.status(400).json({ message: 'Cannot decrease table count: some tables to be removed are occupied' });
      }

      // Delete the excess tables
      await Table.deleteMany({ _id: { $in: tablesToRemove.map(table => table._id) } });
    }

    // Fetch updated tables for the response
    const updatedTables = await Table.find({ categoryId: id }).sort('tableNumber');

    res.status(200).json({
      message: 'Table category updated successfully',
      category: tableCategory,
      tables: updatedTables,
    });
  } catch (error) {
    console.error('Error updating table category:', error);
    res.status(500).json({ message: 'Error updating table category', error: error.message });
  }
};

module.exports = { createTableCategory, getTableCategories, updateTableCategory };