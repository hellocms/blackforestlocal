const StockEntry = require('../models/StockEntry');

exports.createStockEntry = async (req, res) => {
  try {
    const { dealer, category, product, pcs_count, amount } = req.body;

    if (!dealer || !category || !product || !pcs_count || !amount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (pcs_count < 1) {
      return res.status(400).json({ message: 'Pieces count must be a positive integer' });
    }

    if (amount < 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const stockEntry = new StockEntry({
      dealer,
      category,
      product,
      pcs_count,
      amount,
    });

    const savedStockEntry = await stockEntry.save();
    res.status(201).json({ message: 'Stock entry created successfully', stockEntry: savedStockEntry });
  } catch (error) {
    console.error('Error creating stock entry:', error);
    res.status(500).json({ message: 'Server error while creating stock entry', error: error.message });
  }
};

exports.getStockEntries = async (req, res) => {
  try {
    const stockEntries = await StockEntry.find()
      .populate('dealer', 'dealer_name') // Changed from 'name' to 'dealer_name'
      .populate('category', 'category_name')
      .populate('product', 'product_name');
    console.log('Populated Stock Entries:', stockEntries); // Debug log
    res.status(200).json(stockEntries);
  } catch (error) {
    console.error('Error fetching stock entries:', error);
    res.status(500).json({ message: 'Server error while fetching stock entries', error: error.message });
  }
};

exports.getStockEntryById = async (req, res) => {
  try {
    const { id } = req.params;
    const stockEntry = await StockEntry.findById(id)
      .populate('dealer', 'dealer_name') // Changed from 'name' to 'dealer_name'
      .populate('category', 'category_name')
      .populate('product', 'product_name');
    if (!stockEntry) {
      return res.status(404).json({ message: 'Stock entry not found' });
    }
    res.status(200).json(stockEntry);
  } catch (error) {
    console.error('Error fetching stock entry:', error);
    res.status(500).json({ message: 'Server error while fetching stock entry', error: error.message });
  }
};

exports.updateStockEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { dealer, category, product, pcs_count, amount } = req.body;

    if (!dealer || !category || !product || !pcs_count || !amount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (pcs_count < 1) {
      return res.status(400).json({ message: 'Pieces count must be a positive integer' });
    }

    if (amount < 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const updatedStockEntry = await StockEntry.findByIdAndUpdate(
      id,
      { dealer, category, product, pcs_count, amount, updated_at: Date.now() },
      { new: true }
    );

    if (!updatedStockEntry) {
      return res.status(404).json({ message: 'Stock entry not found' });
    }

    res.status(200).json({ message: 'Stock entry updated successfully', stockEntry: updatedStockEntry });
  } catch (error) {
    console.error('Error updating stock entry:', error);
    res.status(500).json({ message: 'Server error while updating stock entry', error: error.message });
  }
};

exports.deleteStockEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStockEntry = await StockEntry.findByIdAndDelete(id);
    if (!deletedStockEntry) {
      return res.status(404).json({ message: 'Stock entry not found' });
    }
    res.status(200).json({ message: 'Stock entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock entry:', error);
    res.status(500).json({ message: 'Server error while deleting stock entry', error: error.message });
  }
};