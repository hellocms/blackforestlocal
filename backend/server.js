const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const cron = require('node-cron');
const { updateStockOrderStatus } = require('./controllers/orderController');

require('dotenv').config();
const categoryRoutes = require('./routes/categoryRoutes');
const albumRoutes = require('./routes/albumRoutes');
const authRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const branchRoutes = require('./routes/branchRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/order');
const dailyAssignmentsRoutes = require('./routes/dailyAssignments');
const tableCategoryRoutes = require('./routes/tableCategoryRoutes');
const tableRoutes = require('./routes/tableRoutes');
const dealerRoutes = require('./routes/dealerRoutes');
const dealerCategoryRoutes = require('./routes/dealerCategoryRoutes');
const dealerProductRoutes = require('./routes/dealerProductRoutes');
const stockEntryRoutes = require('./routes/stockEntryRoutes');
const billRoutes = require('./routes/billRoutes');
const closingEntryRoutes = require('./routes/closingEntries');
const financialRoutes = require('./routes/financialRoutes');
const companyRoutes = require('./routes/companyRoutes');
const kotOrderRoutes = require('./routes/kotOrderRoutes');
const departmentRoutes = require('./routes/departmentRoutes');

const app = express();

// Ensure the uploads/products directory exists
const uploadDir = path.join(__dirname, 'uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Upload directory created:', uploadDir);
}

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/financial', (req, res, next) => {
  console.log('🛠️ Mounting financial routes at /api/financial');
  financialRoutes(req, res, next);
});
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/daily-assignments', dailyAssignmentsRoutes);
app.use('/api/table-categories', tableCategoryRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/dealer/categories', dealerCategoryRoutes);
app.use('/api/dealer/products', dealerProductRoutes);
app.use('/api/dealer/stock-entries', stockEntryRoutes);
app.use('/api/dealers/bills', billRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/closing-entries', closingEntryRoutes);
app.use('/api', categoryRoutes);
app.use('/api', albumRoutes);
app.use('/api', productRoutes);
app.use('/api', branchRoutes);
app.use('/api', employeeRoutes);
app.use('/api', userRoutes);
app.use('/api/kot-orders', kotOrderRoutes);
app.use('/api/companies', companyRoutes); 
app.use('/api', departmentRoutes)

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Schedule the stock order status update to run every hour
cron.schedule('*/15 * * * *', () => {
  console.log('Running scheduled task to update stock order status');
  updateStockOrderStatus();
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));