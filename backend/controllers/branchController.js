const Branch = require('../models/Branch');
const Product = require('../models/Products');
const Order = require('../models/Order');

// Get all branches (Superadmin-only)
exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add a new branch (Superadmin-only)
exports.addBranch = async (req, res) => {
  const { branchId, name, address, phoneNo, emailId } = req.body;
  try {
    const existingBranch = await Branch.findOne({ branchId });
    if (existingBranch) return res.status(400).json({ message: 'Branch ID already exists' });

    const branch = new Branch({ branchId, name, address, phoneNo, emailId });
    await branch.save();
    res.status(201).json({ message: 'Branch created', branch });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update a branch (Superadmin-only)
exports.updateBranch = async (req, res) => {
  const { branchId, name, address, phoneNo, emailId } = req.body;
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    branch.branchId = branchId || branch.branchId;
    branch.name = name || branch.name;
    branch.address = address || branch.address;
    branch.phoneNo = phoneNo || branch.phoneNo;
    branch.emailId = emailId || branch.emailId;
    await branch.save();

    res.json({ message: 'Branch updated', branch });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get products for a branch (Branch-only)
exports.getBranchProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const { branchId } = req.params;
    const categories = await Category.find()
      .populate('products')
      .exec();
    const branchCategories = categories.filter(category => 
      category.products.some(product => product.branchId === branchId)
    );
    res.status(200).json(branchCategories.map(category => ({
      categoryId: category.categoryId || category._id,
      name: category.name,
      description: category.description,
      productCount: category.products.length,
      status: category.status,
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Place a stock or live order (Branch-only)
exports.placeOrder = async (req, res) => {
  const { branchId, type, items, deliveryDate } = req.body;
  try {
    const orderId = `ORD${Date.now()}`;
    const order = new Order({ orderId, branchId, type, items, deliveryDate });
    await order.save();
    res.status(201).json({ message: `${type} order placed`, order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Submit a return request (Branch-only)
exports.submitReturn = async (req, res) => {
  const { branchId, productId, quantity, reason } = req.body;
  try {
    const order = await Order.findOne({ branchId, status: 'confirmed' });
    if (!order) return res.status(404).json({ message: 'No active order found' });
    order.returnUpdates.push({ productId, quantity, reason });
    await order.save();
    res.status(201).json({ message: 'Return submitted', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// New public method to get branches for general access
exports.getBranchesPublic = async (req, res) => {
  try {
    const branches = await Branch.find().select('_id name'); // Only return _id and name
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = {
  getBranches: exports.getBranches,
  addBranch: exports.addBranch,
  updateBranch: exports.updateBranch,
  getBranchProducts: exports.getBranchProducts,
  placeOrder: exports.placeOrder,
  submitReturn: exports.submitReturn,
  getCategories: exports.getCategories,
  getBranchesPublic: exports.getBranchesPublic, // Add new method
};