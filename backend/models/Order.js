const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  tab: {
    type: String,
    required: true,
  },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      sendingQty: { type: Number, default: 0 },
      receivedQty: { type: Number, default: 0 },
      billedQty: { type: Number, default: 0 },
      price: { type: Number, required: true },
      unit: { type: String, required: true },
      gstRate: { 
        type: mongoose.Schema.Types.Mixed,
        required: true,
        validate: {
          validator: function(v) {
            return (typeof v === 'number' && v >= 0) || v === 'non-gst';
          },
          message: 'gstRate must be a non-negative number or "non-gst"',
        },
      },
      productTotal: { type: Number, required: true },
      productGST: { 
        type: Number, 
        required: true,
      },
      bminstock: { type: Number, default: 0 },
      confirmed: { type: Boolean, default: false },
      updatedAt: { type: Date }, // New: Tracks when product is confirmed
    },
  ],
  paymentMethod: {
    type: String,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  totalGST: {
    type: Number,
    required: true,
  },
  totalWithGST: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'completed', 'neworder', 'pending', 'delivered', 'received'],
    default: 'draft',
  },
  orderId: {
    type: String,
    unique: true,
    default: () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  },
  billNo: {
    type: String,
    unique: true,
  },
  waiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null,
  },
  deliveryDateTime: {
    type: Date,
    required: false,
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for performance
orderSchema.index({ branchId: 1, tab: 1 });
orderSchema.index({ branchId: 1, status: 1, createdAt: -1 });
orderSchema.index({ deliveryDateTime: 1 });
orderSchema.index({ billNo: 1 }, { unique: true, sparse: true });

// Pre-save hook to ensure totals are calculated
orderSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('products') || this.isModified('status')) {
    this.products.forEach(product => {
      const billedQty = Math.max(product.quantity, product.sendingQty || 0);
      product.billedQty = billedQty;
      product.productTotal = billedQty * product.price;
      if (product.gstRate === 'non-gst') {
        product.productGST = 0;
      } else if (typeof product.gstRate === 'number') {
        product.productGST = product.productTotal * (product.gstRate / 100);
      }

      // Auto-set receivedQty on 'received' status if not set
      if (this.status === 'received' && (product.receivedQty === undefined || product.receivedQty === 0)) {
        product.receivedQty = product.sendingQty || 0;
      }
    });
    this.subtotal = this.products.reduce((sum, p) => sum + p.productTotal, 0);
    this.totalGST = this.products.reduce((sum, p) => sum + p.productGST, 0);
    this.totalWithGST = this.subtotal + this.totalGST;
    this.totalItems = this.products.filter(p => p.billedQty > 0).length;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);