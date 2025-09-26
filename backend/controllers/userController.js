const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isActive) { // ✅ Check if user is active
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name || user.username, // Use name, fallback to username
        role: user.role,
        branchId: user.branchId,
      },
      process.env.JWT_SECRET || 'a51bf9319cb2f11abbe848b20b1a39f18071df20f9731a78a7dc7d9cfefd136f60500e5211cfb9337f6b38a84c31fe124b631f8924883fb80eaca18920b0698bc55d5a9f1a1331a761060c0a130a5d13850010bbd3d3ed3149f6856b4f46ab2eb1b5432254dbdbfa7b10cda8f4d7bf2ca79c06478a70e56fa4f5c9d47e42a78cd58a68e45fd7c0404fde1d1094684d2b560bcd005b0322ef392405fb687e9dcc08a597e9a8b0b349be7dd82ec1db07ead9ea7467d476654e10332a8cd8413268dec6f97f05edb57707386566603ab1488b8c5db4899538f36cf398aa4eb6fe7edc61617c12f6c84ac95a7951ab9e30d0b301986e15d274a5beeefdd8e94120d2',
      { expiresIn: '1d' }
    );
    res.json({ token, role: user.role, branchId: user.branchId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.register = async (req, res) => {
  const { username, password, role, branchId } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      role,
      branchId: role === 'branch' ? branchId : undefined,
    });
    await user.save();

    res.status(201).json({ message: 'User created successfully', user: { username, role, branchId } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ✅ Get all users (Superadmin-only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().populate('branchId', 'name'); // Populate branch name
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ✅ Update a user (Superadmin-only)
exports.updateUser = async (req, res) => {
  const { password, role, branchId } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (password) user.password = await bcrypt.hash(password, 10);
    user.role = role || user.role;
    user.branchId = role === 'branch' ? branchId : null;
    await user.save();

    res.json({ message: 'User updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ✅ Toggle user active/inactive status
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ✅ Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.remove();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ✅ Toggle user active/inactive status
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// ✅ Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.remove();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = {
  login: exports.login,
  register: exports.register,
  getUsers: exports.getUsers,
  updateUser: exports.updateUser,
  toggleUserStatus: exports.toggleUserStatus,
  deleteUser: exports.deleteUser,
};