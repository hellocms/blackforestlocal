const KotOrder = require('../models/KotOrder');

// Helper function to generate a unique form number
const generateFormNumber = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Create a new KOT order
exports.createKotOrder = async (req, res) => {
  try {
    const {
      deliveryDate,
      deliveryTime,
      customerName,
      customerNumber,
      address,
      email,
      birthdayDate,
      cakeModel,
      weight,
      flavour,
      type,
      alteration,
      specialCare,
      amount,
      advance,
      branch,
      salesMan,
      deliveryType,
    } = req.body;

    // Calculate balance
    const balance = amount - advance;

    // Generate a unique form number
    let formNumber;
    let isUnique = false;
    while (!isUnique) {
      formNumber = generateFormNumber();
      const existingOrder = await KotOrder.findOne({ formNumber });
      if (!existingOrder) {
        isUnique = true;
      }
    }

    // Get current time for orderTime
    const now = new Date();
    const orderTime = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newKotOrder = new KotOrder({
      formNumber,
      date: now,
      orderTime,
      deliveryDate,
      deliveryTime,
      customerName,
      customerNumber,
      address,
      email,
      birthdayDate,
      cakeModel,
      weight,
      flavour,
      type,
      alteration,
      specialCare,
      amount,
      advance,
      balance,
      branch,
      salesMan,
      deliveryType,
    });

    await newKotOrder.save();
    res.status(201).json({
      success: true,
      message: 'KOT order created successfully',
      data: newKotOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating KOT order',
      error: error.message,
    });
  }
};

// Get a specific KOT order by form number
exports.getKotOrder = async (req, res) => {
  try {
    const { formNumber } = req.params;
    const kotOrder = await KotOrder.findOne({ formNumber });

    if (!kotOrder) {
      return res.status(404).json({
        success: false,
        message: 'KOT order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: kotOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving KOT order',
      error: error.message,
    });
  }
};

// Get all KOT orders
exports.getAllKotOrders = async (req, res) => {
  try {
    const kotOrders = await KotOrder.find();
    res.status(200).json({
      success: true,
      data: kotOrders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving KOT orders',
      error: error.message,
    });
  }
};