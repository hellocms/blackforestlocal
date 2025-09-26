const DealerProduct = require('../models/DealerProduct');

exports.createDealerProduct = async (req, res) => {
  try {
    const { product_name, category, barcode_no, description, price, stock_quantity } = req.body;

    if (!product_name || !category || !barcode_no) {
      return res.status(400).json({ message: 'Product name, category, and barcode number are required' });
    }

    const existingBarcode = await DealerProduct.findOne({ barcode_no });
    if (existingBarcode) {
      return res.status(400).json({ message: 'Barcode number already exists' });
    }

    const existingProduct = await DealerProduct.findOne({ product_name, category });
    if (existingProduct) {
      return res.status(400).json({ message: 'This product name already exists in the selected category' });
    }

    const product = new DealerProduct({
      product_name,
      category,
      barcode_no,
      description,
      price,
      stock_quantity,
    });

    const savedProduct = await product.save();
    res.status(201).json({ message: 'Product created successfully', product: savedProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error while creating product', error: error.message });
  }
};

exports.getDealerProducts = async (req, res) => {
  try {
    const { category } = req.query; // Get category from query params
    let query = {};
    if (category) {
      query.category = category;
    }
    const products = await DealerProduct.find(query).populate('category', 'category_name');
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error while fetching products', error: error.message });
  }
};

exports.getDealerProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await DealerProduct.findById(id).populate('category', 'category_name');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error while fetching product', error: error.message });
  }
};

exports.updateDealerProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, category, barcode_no, description, price, stock_quantity } = req.body;

    if (!product_name || !category || !barcode_no) {
      return res.status(400).json({ message: 'Product name, category, and barcode number are required' });
    }

    const existingBarcode = await DealerProduct.findOne({ barcode_no, _id: { $ne: id } });
    if (existingBarcode) {
      return res.status(400).json({ message: 'Barcode number already exists' });
    }

    const existingProduct = await DealerProduct.findOne({ product_name, category, _id: { $ne: id } });
    if (existingProduct) {
      return res.status(400).json({ message: 'This product name already exists in the selected category' });
    }

    const updatedProduct = await DealerProduct.findByIdAndUpdate(
      id,
      { product_name, category, barcode_no, description, price, stock_quantity, updated_at: Date.now() },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error while updating product', error: error.message });
  }
};

exports.deleteDealerProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await DealerProduct.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error while deleting product', error: error.message });
  }
};