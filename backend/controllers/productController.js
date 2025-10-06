const Product = require('../models/Products');
const Inventory = require('../models/Inventory');
const mongoose = require('mongoose');
const bwipjs = require('bwip-js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage }).array('images', 5);

exports.createProduct = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ message: 'File upload error', error: err });

    try {
      const { name, category, dealers, company, album, description, foodNotes, ingredients, available, isVeg, isCakeProduct, isPastry } = req.body;

      if (!category) {
        return res.status(400).json({ message: 'Category is required' });
      }

      let parsedDealers;
      try {
        parsedDealers = dealers ? JSON.parse(dealers) : [];
        if (!Array.isArray(parsedDealers) || parsedDealers.length === 0) {
          return res.status(400).json({ message: 'At least one dealer is required' });
        }
        if (!parsedDealers.every(id => mongoose.Types.ObjectId.isValid(id))) {
          return res.status(400).json({ message: 'Invalid dealer IDs' });
        }
      } catch (error) {
        return res.status(400).json({ message: 'Invalid dealers format' });
      }

      let parsedCompany = null;
      if (company) {
        if (!mongoose.Types.ObjectId.isValid(company)) {
          return res.status(400).json({ message: 'Invalid company ID' });
        }
        parsedCompany = company;
      }

      let priceDetails = [];
      if (req.body.priceDetails) {
        priceDetails = JSON.parse(req.body.priceDetails).map(detail => ({
          price: detail.price || 0,
          rate: detail.rate !== undefined ? Number(detail.rate) : detail.price || 0,
          offerPercent: detail.offerPercent || 0,
          quantity: detail.quantity || 1,
          unit: detail.unit || 'kg',
          cakeType: isCakeProduct === 'true' && detail.cakeType && ['freshCream', 'butterCream'].includes(detail.cakeType) ? detail.cakeType : undefined,
          gst: detail.gst !== undefined ? Number(detail.gst) : 0
        }));
      }

      const images = req.files.map(file => file.filename);
      const lastProduct = await Product.findOne().sort({ productId: -1 });
      const nextProductId = lastProduct ? String(parseInt(lastProduct.productId) + 1).padStart(5, '0') : '00001';

      const companyPrefix = '8901234';
      const eanWithoutCheckDigit = companyPrefix + nextProductId;
      const checkDigit = calculateEAN13CheckDigit(eanWithoutCheckDigit);
      const generatedUPC = eanWithoutCheckDigit + checkDigit;

      const barcodePath = `uploads/barcodes/${nextProductId}.png`;
      await generateBarcode(generatedUPC, barcodePath);

      const newProduct = new Product({
        productId: nextProductId,
        upc: generatedUPC,
        barcode: barcodePath,
        name,
        category,
        dealers: parsedDealers,
        company: parsedCompany,
        album: isCakeProduct === 'true' ? album : null,
        productType: isCakeProduct === 'true' ? 'cake' : 'non-cake',
        description,
        foodNotes,
        ingredients,
        available: available === 'true',
        images,
        priceDetails,
        isVeg: isVeg === 'false' ? false : true,
        isPastry: isPastry === 'true' || isPastry === true,
      });

      await newProduct.save();
      const populatedProduct = await Product.findById(newProduct._id)
        .populate('category', 'name')
        .populate('dealers', 'dealer_name')
        .populate('company', 'name')
        .populate('album', 'name');

      // Invalidate Redis cache
      const redis = req.app.get('redis');
      await redis.del('products:all');
      await redis.del(`products:category:${category}`);

      res.status(201).json({ message: '✅ Product created successfully!', product: populatedProduct });
    } catch (error) {
      console.error('❌ Backend Error:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
};

exports.updateProduct = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ message: '❌ File upload error', error: err });

    try {
      const { id } = req.params;
      const { name, category, dealers, company, album, description, foodNotes, ingredients, available, isVeg, isCakeProduct, isPastry, removedImages } = req.body;

      const product = await Product.findById(id);
      if (!product) return res.status(404).json({ message: '❌ Product not found' });

      let parsedDealers;
      try {
        parsedDealers = dealers ? JSON.parse(dealers) : [];
        if (!Array.isArray(parsedDealers) || parsedDealers.length === 0) {
          return res.status(400).json({ message: 'At least one dealer is required' });
        }
        if (!parsedDealers.every(id => mongoose.Types.ObjectId.isValid(id))) {
          return res.status(400).json({ message: 'Invalid dealer IDs' });
        }
      } catch (error) {
        return res.status(400).json({ message: 'Invalid dealers format' });
      }

      let parsedCompany = null;
      if (company) {
        if (!mongoose.Types.ObjectId.isValid(company)) {
          return res.status(400).json({ message: 'Invalid company ID' });
        }
        parsedCompany = company;
      }

      let priceDetails = [];
      if (req.body.priceDetails) {
        priceDetails = JSON.parse(req.body.priceDetails).map(detail => ({
          price: detail.price || 0,
          rate: detail.rate !== undefined ? Number(detail.rate) : detail.price || product.priceDetails.find(pd => pd.unit === detail.unit)?.rate || detail.price || 0,
          offerPercent: detail.offerPercent || 0,
          quantity: detail.quantity || 1,
          unit: detail.unit || 'kg',
          cakeType: isCakeProduct === 'true' && detail.unit === 'kg' && detail.cakeType && ['freshCream', 'butterCream'].includes(detail.cakeType) ? detail.cakeType : null,
          gst: detail.gst !== undefined ? Number(detail.gst) : detail.gst || 0,
        }));
      }

      let updatedImages = product.images;
      if (removedImages) {
        let imagesToRemove;
        try {
          imagesToRemove = JSON.parse(removedImages);
          if (!Array.isArray(imagesToRemove)) {
            return res.status(400).json({ message: 'Invalid removedImages format' });
          }
          updatedImages = updatedImages.filter(img => !imagesToRemove.includes(img));
          imagesToRemove.forEach(image => {
            const imagePath = path.join(__dirname, '../uploads', image);
            fs.unlink(imagePath, (err) => {
              if (err) console.error('Error deleting image:', err);
            });
          });
        } catch (error) {
          return res.status(400).json({ message: 'Invalid removedImages format' });
        }
      }

      if (req.files && req.files.length > 0) {
        updatedImages = [...updatedImages, ...req.files.map(file => file.filename)];
      }

      const oldCategory = product.category.toString();
      product.name = name || product.name;
      product.category = category || product.category;
      product.dealers = parsedDealers.length > 0 ? parsedDealers : product.dealers;
      product.company = parsedCompany !== null ? parsedCompany : product.company;
      product.productType = isCakeProduct === 'true' ? 'cake' : 'non-cake';
      product.album = isCakeProduct === 'true' ? (album || product.album) : null;
      product.description = description || product.description || '';
      product.foodNotes = foodNotes || product.foodNotes || '';
      product.ingredients = ingredients || product.ingredients || '';
      product.available = available === 'true' ? true : available === 'false' ? false : product.available;
      product.images = updatedImages;
      product.priceDetails = priceDetails.length > 0 ? priceDetails : product.priceDetails;
      product.isVeg = isVeg !== undefined ? (isVeg === 'true') : product.isVeg;
      product.isPastry = isPastry !== undefined ? (isPastry === 'true' || isPastry === true) : product.isPastry;

      await product.save();

      // Invalidate Redis cache
      const redis = req.app.get('redis');
      await redis.del('products:all');
      await redis.del(`products:category:${oldCategory}`);
      if (category && category !== oldCategory) {
        await redis.del(`products:category:${category}`);
      }
      await redis.del(`product:${id}`);

      const populatedProduct = await Product.findById(product._id)
        .populate('category', 'name')
        .populate('dealers', 'dealer_name')
        .populate('company', 'name')
        .populate('album', 'name');
      res.status(200).json({ message: '✅ Product updated successfully!', product: populatedProduct });
    } catch (error) {
      console.error('❌ Error updating product:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
};

exports.getProducts = async (req, res) => {
  try {
    const redis = req.app.get('redis');
    const categoryId = req.query.categoryId;

    // Define cache key based on whether category filter is applied
    const cacheKey = categoryId ? `products:category:${categoryId}` : 'products:all';

    // Check Redis cache
    const cachedProducts = await redis.get(cacheKey);
    if (cachedProducts) {
      console.log(`✅ Serving products from Redis cache: ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedProducts));
    }

    // Cache miss: Fetch from MongoDB
    let query = Product.find();
    if (categoryId) {
      query = query.where('category').equals(categoryId);
    }
    const products = await query
      .populate('category', 'name')
      .populate('dealers', 'dealer_name')
      .populate('company', 'name')
      .populate('album', 'name')
      .lean();

    // Cache the result for 1 week (604800 seconds)
    await redis.set(cacheKey, JSON.stringify(products), 'EX', 604800);
    console.log(`✅ Cached products in Redis: ${cacheKey}`);

    res.status(200).json(products);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const redis = req.app.get('redis');
    const cacheKey = `product:${req.params.id}`;

    // Check Redis cache
    const cachedProduct = await redis.get(cacheKey);
    if (cachedProduct) {
      console.log(`✅ Serving product from Redis cache: ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedProduct));
    }

    // Cache miss: Fetch from MongoDB
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('dealers', 'dealer_name')
      .populate('company', 'name')
      .populate('album', 'name')
      .lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Cache the result for 1 week (604800 seconds)
    await redis.set(cacheKey, JSON.stringify(product), 'EX', 604800);
    console.log(`✅ Cached product in Redis: ${cacheKey}`);

    res.status(200).json(product);
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.images.length > 0) {
      product.images.forEach(image => {
        const imagePath = path.join(__dirname, '../uploads', image);
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Error deleting image:', err);
        });
      });
    }

    await Inventory.deleteMany({ productId: product._id });
    await Product.findByIdAndDelete(req.params.id);

    // Invalidate Redis cache
    const redis = req.app.get('redis');
    await redis.del('products:all');
    await redis.del(`products:category:${product.category}`);
    await redis.del(`product:${req.params.id}`);

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

async function generateBarcode(upc, barcodePath) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer({
      bcid: 'ean13',
      text: upc,
      scale: 3,
      height: 20,
      includetext: true,
      textxalign: 'center',
    }, (err, png) => {
      if (err) {
        console.error('❌ Error generating barcode:', err);
        reject(err);
      } else {
        fs.writeFileSync(barcodePath, png);
        resolve();
      }
    });
  });
}

function calculateEAN13CheckDigit(ean) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(ean[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

module.exports = {
  createProduct: exports.createProduct,
  updateProduct: exports.updateProduct,
  getProducts: exports.getProducts,
  getProductById: exports.getProductById,
  deleteProduct: exports.deleteProduct,
};