const mongoose = require('mongoose');
const ClosingEntry = require('../models/ClosingEntry');
const Financial = require('../models/Financial');
const Order = require('../models/Order');

// Extended bank to branch mapping including UPI and Credit Card
const bankBranchMapping = {
  'IDFC 1': ['67e2e29328541a7b58d1ca11', '67ed2c7b62b722c49a251e26'],
  'IDFC 2': ['67e1a4b22191787a139a749f', '67e2e1f928541a7b58d1c9f8', '67ed2be162b722c49a251dca'],
  'IDFC 3': ['6841d8b5b5a0fc5644db5b10'],
  'IDFC 4': ['6841d9b7b5a0fc5644db5b18'],
  'UPI': {
    '67e2e29328541a7b58d1ca11': 'IDFC 1',
    '67ed2c7b62b722c49a251e26': 'IDFC 1',
    '67e1a4b22191787a139a749f': 'IDFC 2',
    '67e2e1f928541a7b58d1c9f8': 'IDFC 2',
    '67ed2be162b722c49a251dca': 'IDFC 2',
    '6841d8b5b5a0fc5644db5b10': 'IDFC 3',
    '6841d9b7b5a0fc5644db5b18': 'IDFC 4',
  },
  'Credit Card': {
    '67e2e29328541a7b58d1ca11': 'IDFC 1',
    '67ed2c7b62b722c49a251e26': 'IDFC 1',
    '67e1a4b22191787a139a749f': 'IDFC 2',
    '67e2e1f928541a7b58d1c9f8': 'IDFC 2',
    '67ed2be162b722c49a251dca': 'IDFC 2',
    '6841d8b5b5a0fc5644db5b10': 'IDFC 3',
    '6841d9b7b5a0fc5644db5b18': 'IDFC 4',
  },
};

// Create a new closing entry
exports.createClosingEntry = async (req, res) => {
  try {
    const {
      branchId,
      date,
      systemSales: inputSystemSales,
      manualSales,
      onlineSales,
      expenses,
      expenseDetails,
      creditCardPayment,
      upiPayment,
      cashPayment,
      denom2000,
      denom500,
      denom200,
      denom100,
      denom50,
      denom20,
      denom10,
    } = req.body;

    // Validate required fields
    if (
      !branchId ||
      !date ||
      inputSystemSales === undefined ||
      manualSales === undefined ||
      onlineSales === undefined ||
      expenses === undefined ||
      creditCardPayment === undefined ||
      upiPayment === undefined ||
      cashPayment === undefined ||
      denom2000 === undefined ||
      denom500 === undefined ||
      denom200 === undefined ||
      denom100 === undefined ||
      denom50 === undefined ||
      denom20 === undefined ||
      denom10 === undefined
    ) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Validate expenseDetails
    if (!expenseDetails || !Array.isArray(expenseDetails) || expenseDetails.length === 0) {
      return res.status(400).json({ success: false, message: 'Expense details are required' });
    }

    for (const detail of expenseDetails) {
      if (
        detail.serialNo === undefined ||
        (detail.amount > 0 && (!detail.reason || !detail.recipient)) ||
        detail.amount === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: 'All expense details fields (serialNo, reason, recipient, amount) are required when amount is greater than 0',
        });
      }
      if (detail.amount < 0) {
        return res.status(400).json({ success: false, message: 'Expense amounts must be non-negative' });
      }
    }

    // Validate that the sum of expenseDetails amounts matches the expenses total
    const totalExpenseDetails = expenseDetails.reduce((sum, detail) => sum + detail.amount, 0);
    if (totalExpenseDetails !== expenses) {
      return res.status(400).json({
        success: false,
        message: `Total expenses from details (₹${totalExpenseDetails}) must match the expenses total (₹${expenses})`,
      });
    }

    // Validate non-negative values
    if (
      inputSystemSales < 0 ||
      manualSales < 0 ||
      onlineSales < 0 ||
      expenses < 0 ||
      creditCardPayment < 0 ||
      upiPayment < 0 ||
      cashPayment < 0 ||
      denom2000 < 0 ||
      denom500 < 0 ||
      denom200 < 0 ||
      denom100 < 0 ||
      denom50 < 0 ||
      denom20 < 0 ||
      denom10 < 0
    ) {
      return res.status(400).json({ success: false, message: 'All values must be non-negative' });
    }

    // Calculate total cash from denominations
    const totalCashFromDenom =
      denom2000 * 2000 +
      denom500 * 500 +
      denom200 * 200 +
      denom100 * 100 +
      denom50 * 50 +
      denom20 * 20 +
      denom10 * 10;

    if (totalCashFromDenom !== cashPayment) {
      return res.status(400).json({
        success: false,
        message: `Total cash from denominations (₹${totalCashFromDenom}) must equal cash payment (₹${cashPayment})`,
      });
    }

    // Handle systemSales: if input is 0, calculate the delta from billing tab
    let systemSales = inputSystemSales;
    if (inputSystemSales === 0) {
      const dateObj = new Date(date);
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);

      const billingOrdersAgg = await Order.aggregate([
        {
          $match: {
            branchId: new mongoose.Types.ObjectId(branchId),
            tab: 'billing',
            status: 'completed',
            createdAt: { $gte: startOfDay, $lte: endOfDay },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalWithGST' },
          },
        },
      ]);

      const totalBilling = billingOrdersAgg.length > 0 ? billingOrdersAgg[0].total : 0;

      const previousClosingAgg = await ClosingEntry.aggregate([
        {
          $match: {
            branchId: new mongoose.Types.ObjectId(branchId),
            date: dateObj,
          },
        },
        {
          $group: {
            _id: null,
            sum: { $sum: '$systemSales' },
          },
        },
      ]);

      const previousSum = previousClosingAgg.length > 0 ? previousClosingAgg[0].sum : 0;

      systemSales = Math.max(0, totalBilling - previousSum);
    }

    // Calculate total sales
    const totalSales = systemSales + manualSales + onlineSales;

    // Calculate net result
    const netResult = totalSales - expenses;

    // Create new closing entry
    const closingEntry = new ClosingEntry({
      branchId,
      date,
      systemSales,
      manualSales,
      onlineSales,
      expenses,
      expenseDetails,
      netResult,
      creditCardPayment,
      upiPayment,
      cashPayment,
      denom2000,
      denom500,
      denom200,
      denom100,
      denom50,
      denom20,
      denom10,
      isFinalized: false,
    });

    // Save closing entry
    await closingEntry.save();

    // Update Financial document
    const financial = await Financial.findOne();
    if (!financial) {
      console.error('Financial data not found');
      return res.status(404).json({ success: false, message: 'Financial data not found' });
    }

    const branchIdObj = new mongoose.Types.ObjectId(branchId);

    // Add cashPayment transaction
    if (cashPayment > 0) {
      let branchBalanceIndex = financial.branchBalances.findIndex(bb => bb.branch.toString() === branchId);
      if (branchBalanceIndex === -1) {
        financial.branchBalances.push({ branch: branchIdObj, cashBalance: 0 });
        branchBalanceIndex = financial.branchBalances.length - 1;
      }
      financial.branchBalances[branchBalanceIndex].cashBalance += cashPayment;
      financial.totalCashBalance += cashPayment;
      financial.transactions.push({
        type: 'Credit - Deposit',
        source: 'CASH IN HAND',
        branch: branchIdObj,
        amount: cashPayment,
        expenseCategory: 'N/A',
        remarks: 'From Closing Entry',
        date: new Date(date),
      });
    }

    // Combine UPI and Credit Card payments if they map to the same bank
    const upiBank = bankBranchMapping['UPI'][branchId];
    const creditCardBank = bankBranchMapping['Credit Card'][branchId];
    if (!upiBank || !creditCardBank) {
      console.error(`No bank mapping for UPI or Credit Card for branch ${branchId}`);
      return res.status(400).json({ success: false, message: `No bank mapping for UPI or Credit Card for branch ${branchId}` });
    }

    let combinedBankPayment = 0;
    let combinedBankSource = null;
    let combinedRemarks = [];

    if (upiPayment > 0) {
      combinedBankPayment += upiPayment;
      combinedBankSource = upiBank;
      combinedRemarks.push('UPI');
    }

    if (creditCardPayment > 0 && creditCardBank === upiBank) {
      combinedBankPayment += creditCardPayment;
      combinedRemarks.push('Credit Card');
    } else if (creditCardPayment > 0) {
      // Handle Credit Card separately if it maps to a different bank
      switch (creditCardBank) {
        case 'IDFC 1':
          financial.idfc1Balance += creditCardPayment;
          break;
        case 'IDFC 2':
          financial.idfc2Balance += creditCardPayment;
          break;
        case 'IDFC 3':
          financial.idfc3Balance += creditCardPayment;
          break;
        case 'IDFC 4':
          financial.idfc4Balance += creditCardPayment;
          break;
        default:
          console.error(`Invalid Credit Card bank mapping for branch ${branchId}`);
          return res.status(400).json({ success: false, message: `Invalid Credit Card bank mapping for branch ${branchId}` });
      }
      financial.transactions.push({
        type: 'Credit - Deposit',
        source: creditCardBank,
        branch: branchIdObj,
        amount: creditCardPayment,
        expenseCategory: 'N/A',
        remarks: 'From Closing Entry Credit Card',
        date: new Date(date),
      });
    }

    // Add combined UPI and Credit Card transaction if applicable
    if (combinedBankPayment > 0) {
      switch (combinedBankSource) {
        case 'IDFC 1':
          financial.idfc1Balance += combinedBankPayment;
          break;
        case 'IDFC 2':
          financial.idfc2Balance += combinedBankPayment;
          break;
        case 'IDFC 3':
          financial.idfc3Balance += combinedBankPayment;
          break;
        case 'IDFC 4':
          financial.idfc4Balance += combinedBankPayment;
          break;
        default:
          console.error(`Invalid combined bank mapping for branch ${branchId}`);
          return res.status(400).json({ success: false, message: `Invalid combined bank mapping for branch ${branchId}` });
      }
      financial.transactions.push({
        type: 'Credit - Deposit',
        source: combinedBankSource,
        branch: branchIdObj,
        amount: combinedBankPayment,
        expenseCategory: 'N/A',
        remarks: `From Closing Entry (${combinedRemarks.join(' + ')})`,
        date: new Date(date),
      });
    }

    financial.markModified('branchBalances');
    financial.lastUpdated = Date.now();
    await financial.save();

    res.status(201).json({ success: true, message: 'Closing entry created successfully', closingEntry });
  } catch (error) {
    console.error('Error creating closing entry:', error);
    res.status(500).json({ success: false, message: 'Server error while creating closing entry' });
  }
};

// Update an existing closing entry
exports.updateClosingEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      branchId,
      date,
      systemSales: inputSystemSales,
      manualSales,
      onlineSales,
      expenses,
      expenseDetails,
      creditCardPayment,
      upiPayment,
      cashPayment,
      denom2000,
      denom500,
      denom200,
      denom100,
      denom50,
      denom20,
      denom10,
      isFinalized,
    } = req.body;

    // Find the existing closing entry
    const existingEntry = await ClosingEntry.findById(id);
    if (!existingEntry) {
      return res.status(404).json({ success: false, message: 'Closing entry not found' });
    }

    // Prevent updates if entry is finalized
    if (existingEntry.isFinalized) {
      return res.status(400).json({ success: false, message: 'Cannot update a finalized closing entry' });
    }

    // Validate required fields
    if (
      !branchId ||
      !date ||
      inputSystemSales === undefined ||
      manualSales === undefined ||
      onlineSales === undefined ||
      expenses === undefined ||
      creditCardPayment === undefined ||
      upiPayment === undefined ||
      cashPayment === undefined ||
      denom2000 === undefined ||
      denom500 === undefined ||
      denom200 === undefined ||
      denom100 === undefined ||
      denom50 === undefined ||
      denom20 === undefined ||
      denom10 === undefined
    ) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Validate expenseDetails
    if (!expenseDetails || !Array.isArray(expenseDetails) || expenseDetails.length === 0) {
      return res.status(400).json({ success: false, message: 'Expense details are required' });
    }

    for (const detail of expenseDetails) {
      if (
        detail.serialNo === undefined ||
        (detail.amount > 0 && (!detail.reason || !detail.recipient)) ||
        detail.amount === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: 'All expense details fields (serialNo, reason, recipient, amount) are required when amount is greater than 0',
        });
      }
      if (detail.amount < 0) {
        return res.status(400).json({ success: false, message: 'Expense amounts must be non-negative' });
      }
    }

    // Validate that the sum of expenseDetails amounts matches the expenses total
    const totalExpenseDetails = expenseDetails.reduce((sum, detail) => sum + detail.amount, 0);
    if (totalExpenseDetails !== expenses) {
      return res.status(400).json({
        success: false,
        message: `Total expenses from details (₹${totalExpenseDetails}) must match the expenses total (₹${expenses})`,
      });
    }

    // Validate non-negative values
    if (
      inputSystemSales < 0 ||
      manualSales < 0 ||
      onlineSales < 0 ||
      expenses < 0 ||
      creditCardPayment < 0 ||
      upiPayment < 0 ||
      cashPayment < 0 ||
      denom2000 < 0 ||
      denom500 < 0 ||
      denom200 < 0 ||
      denom100 < 0 ||
      denom50 < 0 ||
      denom20 < 0 ||
      denom10 < 0
    ) {
      return res.status(400).json({ success: false, message: 'All values must be non-negative' });
    }

    // Calculate total cash from denominations
    const totalCashFromDenom =
      denom2000 * 2000 +
      denom500 * 500 +
      denom200 * 200 +
      denom100 * 100 +
      denom50 * 50 +
      denom20 * 20 +
      denom10 * 10;

    if (totalCashFromDenom !== cashPayment) {
      return res.status(400).json({
        success: false,
        message: `Total cash from denominations (₹${totalCashFromDenom}) must equal cash payment (₹${cashPayment})`,
      });
    }

    // Handle systemSales: if input is 0, calculate the delta from billing tab
    let systemSales = inputSystemSales;
    if (inputSystemSales === 0) {
      const dateObj = new Date(date);
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);

      const billingOrdersAgg = await Order.aggregate([
        {
          $match: {
            branchId: new mongoose.Types.ObjectId(branchId),
            tab: 'billing',
            status: 'completed',
            createdAt: { $gte: startOfDay, $lte: endOfDay },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalWithGST' },
          },
        },
      ]);

      const totalBilling = billingOrdersAgg.length > 0 ? billingOrdersAgg[0].total : 0;

      const previousClosingAgg = await ClosingEntry.aggregate([
        {
          $match: {
            branchId: new mongoose.Types.ObjectId(branchId),
            date: dateObj,
            _id: { $ne: new mongoose.Types.ObjectId(id) },
          },
        },
        {
          $group: {
            _id: null,
            sum: { $sum: '$systemSales' },
          },
        },
      ]);

      const previousSum = previousClosingAgg.length > 0 ? previousClosingAgg[0].sum : 0;

      systemSales = Math.max(0, totalBilling - previousSum);
    }

    // Calculate total sales
    const totalSales = systemSales + manualSales + onlineSales;

    // Calculate net result
    const netResult = totalSales - expenses;

    // Find financial document
    const financial = await Financial.findOne();
    if (!financial) {
      console.error('Financial data not found');
      return res.status(404).json({ success: false, message: 'Financial data not found' });
    }

    const branchIdObj = new mongoose.Types.ObjectId(branchId);

    // Reverse previous cashPayment
    if (existingEntry.cashPayment > 0) {
      const branchBalanceIndex = financial.branchBalances.findIndex(bb => bb.branch.toString() === branchId);
      if (branchBalanceIndex !== -1) {
        financial.branchBalances[branchBalanceIndex].cashBalance -= existingEntry.cashPayment;
        financial.totalCashBalance -= existingEntry.cashPayment;
        if (financial.branchBalances[branchBalanceIndex].cashBalance <= 0) {
          financial.branchBalances.splice(branchBalanceIndex, 1);
        }
      }
    }

    // Reverse previous upiPayment
    if (existingEntry.upiPayment > 0) {
      const upiBank = bankBranchMapping['UPI'][branchId];
      if (upiBank) {
        switch (upiBank) {
          case 'IDFC 1':
            financial.idfc1Balance -= existingEntry.upiPayment;
            break;
          case 'IDFC 2':
            financial.idfc2Balance -= existingEntry.upiPayment;
            break;
          case 'IDFC 3':
            financial.idfc3Balance -= existingEntry.upiPayment;
            break;
          case 'IDFC 4':
            financial.idfc4Balance -= existingEntry.upiPayment;
            break;
        }
      }
    }

    // Reverse previous creditCardPayment
    if (existingEntry.creditCardPayment > 0) {
      const creditCardBank = bankBranchMapping['Credit Card'][branchId];
      if (creditCardBank) {
        switch (creditCardBank) {
          case 'IDFC 1':
            financial.idfc1Balance -= existingEntry.creditCardPayment;
            break;
          case 'IDFC 2':
            financial.idfc2Balance -= existingEntry.creditCardPayment;
            break;
          case 'IDFC 3':
            financial.idfc3Balance -= existingEntry.creditCardPayment;
            break;
          case 'IDFC 4':
            financial.idfc4Balance -= existingEntry.creditCardPayment;
            break;
        }
      }
    }

    // Add new cashPayment transaction
    if (cashPayment > 0) {
      let branchBalanceIndex = financial.branchBalances.findIndex(bb => bb.branch.toString() === branchId);
      if (branchBalanceIndex === -1) {
        financial.branchBalances.push({ branch: branchIdObj, cashBalance: 0 });
        branchBalanceIndex = financial.branchBalances.length - 1;
      }
      financial.branchBalances[branchBalanceIndex].cashBalance += cashPayment;
      financial.totalCashBalance += cashPayment;
      financial.transactions.push({
        type: 'Credit - Deposit',
        source: 'CASH IN HAND',
        branch: branchIdObj,
        amount: cashPayment,
        expenseCategory: 'N/A',
        remarks: isFinalized ? 'From Closing Entry Finalized' : 'From Closing Entry Update',
        date: new Date(date),
      });
    }

    // Combine UPI and Credit Card payments if they map to the same bank
    const upiBank = bankBranchMapping['UPI'][branchId];
    const creditCardBank = bankBranchMapping['Credit Card'][branchId];
    if (!upiBank || !creditCardBank) {
      console.error(`No bank mapping for UPI or Credit Card for branch ${branchId}`);
      return res.status(400).json({ success: false, message: `No bank mapping for UPI or Credit Card for branch ${branchId}` });
    }

    let combinedBankPayment = 0;
    let combinedBankSource = null;
    let combinedRemarks = [];

    if (upiPayment > 0) {
      combinedBankPayment += upiPayment;
      combinedBankSource = upiBank;
      combinedRemarks.push('UPI');
    }

    if (creditCardPayment > 0 && creditCardBank === upiBank) {
      combinedBankPayment += creditCardPayment;
      combinedRemarks.push('Credit Card');
    } else if (creditCardPayment > 0) {
      // Handle Credit Card separately if it maps to a different bank
      switch (creditCardBank) {
        case 'IDFC 1':
          financial.idfc1Balance += creditCardPayment;
          break;
        case 'IDFC 2':
          financial.idfc2Balance += creditCardPayment;
          break;
        case 'IDFC 3':
          financial.idfc3Balance += creditCardPayment;
          break;
        case 'IDFC 4':
          financial.idfc4Balance += creditCardPayment;
          break;
        default:
          console.error(`Invalid Credit Card bank mapping for branch ${branchId}`);
          return res.status(400).json({ success: false, message: `Invalid Credit Card bank mapping for branch ${branchId}` });
      }
      financial.transactions.push({
        type: 'Credit - Deposit',
        source: creditCardBank,
        branch: branchIdObj,
        amount: creditCardPayment,
        expenseCategory: 'N/A',
        remarks: isFinalized ? 'From Closing Entry Finalized Credit Card' : 'From Closing Entry Update Credit Card',
        date: new Date(date),
      });
    }

    // Add combined UPI and Credit Card transaction if applicable
    if (combinedBankPayment > 0) {
      switch (combinedBankSource) {
        case 'IDFC 1':
          financial.idfc1Balance += combinedBankPayment;
          break;
        case 'IDFC 2':
          financial.idfc2Balance += combinedBankPayment;
          break;
        case 'IDFC 3':
          financial.idfc3Balance += combinedBankPayment;
          break;
        case 'IDFC 4':
          financial.idfc4Balance += combinedBankPayment;
          break;
        default:
          console.error(`Invalid combined bank mapping for branch ${branchId}`);
          return res.status(400).json({ success: false, message: `Invalid combined bank mapping for branch ${branchId}` });
      }
      financial.transactions.push({
        type: 'Credit - Deposit',
        source: combinedBankSource,
        branch: branchIdObj,
        amount: combinedBankPayment,
        expenseCategory: 'N/A',
        remarks: isFinalized ? `From Closing Entry Finalized (${combinedRemarks.join(' + ')})` : `From Closing Entry Update (${combinedRemarks.join(' + ')})`,
        date: new Date(date),
      });
    }

    financial.markModified('branchBalances');
    financial.lastUpdated = Date.now();
    await financial.save();

    // Update the closing entry
    const updatedClosingEntry = await ClosingEntry.findByIdAndUpdate(
      id,
      {
        branchId,
        date,
        systemSales,
        manualSales,
        onlineSales,
        expenses,
        expenseDetails,
        netResult,
        creditCardPayment,
        upiPayment,
        cashPayment,
        denom2000,
        denom500,
        denom200,
        denom100,
        denom50,
        denom20,
        denom10,
        isFinalized,
      },
      { new: true, runValidators: true }
    );

    if (!updatedClosingEntry) {
      console.error('Closing entry not found during update');
      return res.status(404).json({ success: false, message: 'Closing entry not found' });
    }

    res.status(200).json({ success: true, message: isFinalized ? 'Closing entry finalized successfully' : 'Closing entry updated successfully', closingEntry: updatedClosingEntry });
  } catch (error) {
    console.error('Error updating closing entry:', error);
    res.status(500).json({ success: false, message: 'Server error while updating closing entry' });
  }
};

// Create or update a closing entry from expense sheet
exports.createExpenseSheetEntry = async (req, res) => {
  try {
    const { branchId, date, expenseDetails } = req.body;

    // Validate required fields
    if (!branchId || !date || !expenseDetails || !Array.isArray(expenseDetails) || expenseDetails.length === 0) {
      return res.status(400).json({ success: false, message: 'Branch ID, date, and expense details are required' });
    }

    // Validate expenseDetails
    for (const detail of expenseDetails) {
      if (
        detail.serialNo === undefined ||
        (detail.amount > 0 && (!detail.reason || !detail.recipient)) ||
        detail.amount === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: 'All expense details fields (serialNo, reason, recipient, amount) are required when amount is greater than 0',
        });
      }
      if (detail.amount < 0) {
        return res.status(400).json({ success: false, message: 'Expense amounts must be non-negative' });
      }
    }

    // Calculate total expenses from new expenseDetails
    const newExpenses = expenseDetails.reduce((sum, detail) => sum + detail.amount, 0);

    // Check for existing non-finalized closing entry for the branch and date
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const existingEntry = await ClosingEntry.findOne({
      branchId: new mongoose.Types.ObjectId(branchId),
      date: { $gte: startOfDay, $lte: endOfDay },
      isFinalized: false,
    });

    // Handle systemSales: calculate delta from billing tab
    const billingOrdersAgg = await Order.aggregate([
      {
        $match: {
          branchId: new mongoose.Types.ObjectId(branchId),
          tab: 'billing',
          status: 'completed',
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalWithGST' },
        },
      },
    ]);

    const totalBilling = billingOrdersAgg.length > 0 ? billingOrdersAgg[0].total : 0;

    const previousClosingAgg = await ClosingEntry.aggregate([
      {
        $match: {
          branchId: new mongoose.Types.ObjectId(branchId),
          date: { $gte: startOfDay, $lte: endOfDay },
          ...(existingEntry ? { _id: { $ne: existingEntry._id } } : {}),
        },
      },
      {
        $group: {
          _id: null,
          sum: { $sum: '$systemSales' },
        },
      },
    ]);

    const previousSum = previousClosingAgg.length > 0 ? previousClosingAgg[0].sum : 0;
    const systemSales = Math.max(0, totalBilling - previousSum);

    let closingEntry;
    const branchIdObj = new mongoose.Types.ObjectId(branchId);

    if (existingEntry) {
      // Update existing non-finalized entry
      const updatedExpenseDetails = [
        ...existingEntry.expenseDetails,
        ...expenseDetails.map((detail, index) => ({
          ...detail,
          serialNo: existingEntry.expenseDetails.length + index + 1,
        })),
      ];

      const totalExpenses = updatedExpenseDetails.reduce((sum, detail) => sum + detail.amount, 0);

      // Calculate total sales and net result
      const totalSales = systemSales + (existingEntry.manualSales || 0) + (existingEntry.onlineSales || 0);
      const netResult = totalSales - totalExpenses;

      // Update financial document: reverse previous transactions
      const financial = await Financial.findOne();
      if (!financial) {
        console.error('Financial data not found');
        return res.status(404).json({ success: false, message: 'Financial data not found' });
      }

      // Reverse previous cashPayment
      if (existingEntry.cashPayment > 0) {
        const branchBalanceIndex = financial.branchBalances.findIndex(bb => bb.branch.toString() === branchId);
        if (branchBalanceIndex !== -1) {
          financial.branchBalances[branchBalanceIndex].cashBalance -= existingEntry.cashPayment;
          financial.totalCashBalance -= existingEntry.cashPayment;
          if (financial.branchBalances[branchBalanceIndex].cashBalance <= 0) {
            financial.branchBalances.splice(branchBalanceIndex, 1);
          }
        }
      }

      // Reverse previous upiPayment
      if (existingEntry.upiPayment > 0) {
        const upiBank = bankBranchMapping['UPI'][branchId];
        if (upiBank) {
          switch (upiBank) {
            case 'IDFC 1':
              financial.idfc1Balance -= existingEntry.upiPayment;
              break;
            case 'IDFC 2':
              financial.idfc2Balance -= existingEntry.upiPayment;
              break;
            case 'IDFC 3':
              financial.idfc3Balance -= existingEntry.upiPayment;
              break;
            case 'IDFC 4':
              financial.idfc4Balance -= existingEntry.upiPayment;
              break;
          }
        }
      }

      // Reverse previous creditCardPayment
      if (existingEntry.creditCardPayment > 0) {
        const creditCardBank = bankBranchMapping['Credit Card'][branchId];
        if (creditCardBank) {
          switch (creditCardBank) {
            case 'IDFC 1':
              financial.idfc1Balance -= existingEntry.creditCardPayment;
              break;
            case 'IDFC 2':
              financial.idfc2Balance -= existingEntry.creditCardPayment;
              break;
            case 'IDFC 3':
              financial.idfc3Balance -= existingEntry.creditCardPayment;
              break;
            case 'IDFC 4':
              financial.idfc4Balance -= existingEntry.creditCardPayment;
              break;
          }
        }
      }

      // Add new transactions (using existing values for payments)
      const cashPayment = existingEntry.cashPayment || 0;
      const upiPayment = existingEntry.upiPayment || 0;
      const creditCardPayment = existingEntry.creditCardPayment || 0;

      if (cashPayment > 0) {
        let branchBalanceIndex = financial.branchBalances.findIndex(bb => bb.branch.toString() === branchId);
        if (branchBalanceIndex === -1) {
          financial.branchBalances.push({ branch: branchIdObj, cashBalance: 0 });
          branchBalanceIndex = financial.branchBalances.length - 1;
        }
        financial.branchBalances[branchBalanceIndex].cashBalance += cashPayment;
        financial.totalCashBalance += cashPayment;
        financial.transactions.push({
          type: 'Credit - Deposit',
          source: 'CASH IN HAND',
          branch: branchIdObj,
          amount: cashPayment,
          expenseCategory: 'N/A',
          remarks: 'From Expense Sheet Update',
          date: new Date(date),
        });
      }

      const upiBank = bankBranchMapping['UPI'][branchId];
      const creditCardBank = bankBranchMapping['Credit Card'][branchId];
      if (!upiBank || !creditCardBank) {
        console.error(`No bank mapping for UPI or Credit Card for branch ${branchId}`);
        return res.status(400).json({ success: false, message: `No bank mapping for UPI or Credit Card for branch ${branchId}` });
      }

      let combinedBankPayment = 0;
      let combinedBankSource = null;
      let combinedRemarks = [];

      if (upiPayment > 0) {
        combinedBankPayment += upiPayment;
        combinedBankSource = upiBank;
        combinedRemarks.push('UPI');
      }

      if (creditCardPayment > 0 && creditCardBank === upiBank) {
        combinedBankPayment += creditCardPayment;
        combinedRemarks.push('Credit Card');
      } else if (creditCardPayment > 0) {
        switch (creditCardBank) {
          case 'IDFC 1':
            financial.idfc1Balance += creditCardPayment;
            break;
          case 'IDFC 2':
            financial.idfc2Balance += creditCardPayment;
            break;
          case 'IDFC 3':
            financial.idfc3Balance += creditCardPayment;
            break;
          case 'IDFC 4':
            financial.idfc4Balance += creditCardPayment;
            break;
          default:
            console.error(`Invalid Credit Card bank mapping for branch ${branchId}`);
            return res.status(400).json({ success: false, message: `Invalid Credit Card bank mapping for branch ${branchId}` });
        }
        financial.transactions.push({
          type: 'Credit - Deposit',
          source: creditCardBank,
          branch: branchIdObj,
          amount: creditCardPayment,
          expenseCategory: 'N/A',
          remarks: 'From Expense Sheet Update Credit Card',
          date: new Date(date),
        });
      }

      if (combinedBankPayment > 0) {
        switch (combinedBankSource) {
          case 'IDFC 1':
            financial.idfc1Balance += combinedBankPayment;
            break;
          case 'IDFC 2':
            financial.idfc2Balance += combinedBankPayment;
            break;
          case 'IDFC 3':
            financial.idfc3Balance += combinedBankPayment;
            break;
          case 'IDFC 4':
            financial.idfc4Balance += combinedBankPayment;
            break;
          default:
            console.error(`Invalid combined bank mapping for branch ${branchId}`);
            return res.status(400).json({ success: false, message: `Invalid combined bank mapping for branch ${branchId}` });
        }
        financial.transactions.push({
          type: 'Credit - Deposit',
          source: combinedBankSource,
          branch: branchIdObj,
          amount: combinedBankPayment,
          expenseCategory: 'N/A',
          remarks: `From Expense Sheet Update (${combinedRemarks.join(' + ')})`,
          date: new Date(date),
        });
      }

      financial.markModified('branchBalances');
      financial.lastUpdated = Date.now();
      await financial.save();

      // Update the closing entry
      closingEntry = await ClosingEntry.findByIdAndUpdate(
        existingEntry._id,
        {
          branchId,
          date,
          systemSales,
          manualSales: existingEntry.manualSales || 0,
          onlineSales: existingEntry.onlineSales || 0,
          expenses: totalExpenses,
          expenseDetails: updatedExpenseDetails,
          netResult,
          creditCardPayment: existingEntry.creditCardPayment || 0,
          upiPayment: existingEntry.upiPayment || 0,
          cashPayment: existingEntry.cashPayment || 0,
          denom2000: existingEntry.denom2000 || 0,
          denom500: existingEntry.denom500 || 0,
          denom200: existingEntry.denom200 || 0,
          denom100: existingEntry.denom100 || 0,
          denom50: existingEntry.denom50 || 0,
          denom20: existingEntry.denom20 || 0,
          denom10: existingEntry.denom10 || 0,
          isFinalized: false,
        },
        { new: true, runValidators: true }
      );

      if (!closingEntry) {
        console.error('Closing entry not found during update');
        return res.status(404).json({ success: false, message: 'Closing entry not found' });
      }

      res.status(200).json({ success: true, message: 'Closing entry updated with new expense details', closingEntry });
    } else {
      // Create new closing entry with default values
      const manualSales = 0;
      const onlineSales = 0;
      const creditCardPayment = 0;
      const upiPayment = 0;
      const cashPayment = 0;
      const denom2000 = 0;
      const denom500 = 0;
      const denom200 = 0;
      const denom100 = 0;
      const denom50 = 0;
      const denom20 = 0;
      const denom10 = 0;

      // Calculate total sales and net result
      const totalSales = systemSales + manualSales + onlineSales;
      const netResult = totalSales - newExpenses;

      // Create new closing entry
      closingEntry = new ClosingEntry({
        branchId,
        date,
        systemSales,
        manualSales,
        onlineSales,
        expenses: newExpenses,
        expenseDetails,
        netResult,
        creditCardPayment,
        upiPayment,
        cashPayment,
        denom2000,
        denom500,
        denom200,
        denom100,
        denom50,
        denom20,
        denom10,
        isFinalized: false,
      });

      // Save closing entry
      await closingEntry.save();

      // Update Financial document
      const financial = await Financial.findOne();
      if (!financial) {
        console.error('Financial data not found');
        return res.status(404).json({ success: false, message: 'Financial data not found' });
      }

      if (cashPayment > 0) {
        let branchBalanceIndex = financial.branchBalances.findIndex(bb => bb.branch.toString() === branchId);
        if (branchBalanceIndex === -1) {
          financial.branchBalances.push({ branch: branchIdObj, cashBalance: 0 });
          branchBalanceIndex = financial.branchBalances.length - 1;
        }
        financial.branchBalances[branchBalanceIndex].cashBalance += cashPayment;
        financial.totalCashBalance += cashPayment;
        financial.transactions.push({
          type: 'Credit - Deposit',
          source: 'CASH IN HAND',
          branch: branchIdObj,
          amount: cashPayment,
          expenseCategory: 'N/A',
          remarks: 'From Expense Sheet Entry',
          date: new Date(date),
        });
      }

      const upiBank = bankBranchMapping['UPI'][branchId];
      const creditCardBank = bankBranchMapping['Credit Card'][branchId];
      if (!upiBank || !creditCardBank) {
        console.error(`No bank mapping for UPI or Credit Card for branch ${branchId}`);
        return res.status(400).json({ success: false, message: `No bank mapping for UPI or Credit Card for branch ${branchId}` });
      }

      let combinedBankPayment = 0;
      let combinedBankSource = null;
      let combinedRemarks = [];

      if (upiPayment > 0) {
        combinedBankPayment += upiPayment;
        combinedBankSource = upiBank;
        combinedRemarks.push('UPI');
      }

      if (creditCardPayment > 0 && creditCardBank === upiBank) {
        combinedBankPayment += creditCardPayment;
        combinedRemarks.push('Credit Card');
      } else if (creditCardPayment > 0) {
        switch (creditCardBank) {
          case 'IDFC 1':
            financial.idfc1Balance += creditCardPayment;
            break;
          case 'IDFC 2':
            financial.idfc2Balance += creditCardPayment;
            break;
          case 'IDFC 3':
            financial.idfc3Balance += creditCardPayment;
            break;
          case 'IDFC 4':
            financial.idfc4Balance += creditCardPayment;
            break;
          default:
            console.error(`Invalid Credit Card bank mapping for branch ${branchId}`);
            return res.status(400).json({ success: false, message: `Invalid Credit Card bank mapping for branch ${branchId}` });
        }
        financial.transactions.push({
          type: 'Credit - Deposit',
          source: creditCardBank,
          branch: branchIdObj,
          amount: creditCardPayment,
          expenseCategory: 'N/A',
          remarks: 'From Expense Sheet Entry Credit Card',
          date: new Date(date),
        });
      }

      if (combinedBankPayment > 0) {
        switch (combinedBankSource) {
          case 'IDFC 1':
            financial.idfc1Balance += combinedBankPayment;
            break;
          case 'IDFC 2':
            financial.idfc2Balance += combinedBankPayment;
            break;
          case 'IDFC 3':
            financial.idfc3Balance += combinedBankPayment;
            break;
          case 'IDFC 4':
            financial.idfc4Balance += combinedBankPayment;
            break;
          default:
            console.error(`Invalid combined bank mapping for branch ${branchId}`);
            return res.status(400).json({ success: false, message: `Invalid combined bank mapping for branch ${branchId}` });
        }
        financial.transactions.push({
          type: 'Credit - Deposit',
          source: combinedBankSource,
          branch: branchIdObj,
          amount: combinedBankPayment,
          expenseCategory: 'N/A',
          remarks: `From Expense Sheet Entry (${combinedRemarks.join(' + ')})`,
          date: new Date(date),
        });
      }

      financial.markModified('branchBalances');
      financial.lastUpdated = Date.now();
      await financial.save();

      res.status(201).json({ success: true, message: 'Expense sheet entry created successfully', closingEntry });
    }
  } catch (error) {
    console.error('Error creating expense sheet entry:', error);
    res.status(500).json({ success: false, message: 'Server error while creating expense sheet entry' });
  }
};

// Get all closing entries
exports.getClosingEntries = async (req, res) => {
  try {
    const closingEntries = await ClosingEntry.find()
      .populate('branchId', 'name')
      .sort({ date: -1 });

    res.status(200).json(closingEntries);
  } catch (error) {
    console.error('Error fetching closing entries:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching closing entries' });
  }
};