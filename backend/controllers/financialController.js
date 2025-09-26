const mongoose = require('mongoose');
const Financial = require('../models/Financial');

// Bank to branch mapping including UPI and Credit Card
const bankBranchMapping = {
  'IDFC 1': [
    '67e2e29328541a7b58d1ca11',
    '67ed2c7b62b722c49a251e26',
    '6841c13ab5a0fc5644db2f7e', // New branch
    '67ea89f5524fad83e386415b'  // New branch
  ],
  'IDFC 2': [
    '67e1a4b22191787a139a749f',
    '67e2e1f928541a7b58d1c9f8',
    '67ed2be162b722c49a251dca',
    '6841bef0b5a0fc5644db227d',
    '6838102f710163091394b581',
    '6841c13ab5a0fc5644db2f7e', // New branch
    '67ea89f5524fad83e386415b'  // New branch
  ],
  'IDFC 3': ['6841d8b5b5a0fc5644db5b10'],
  'IDFC 4': ['6841d9b7b5a0fc5644db5b18'],
  'UPI': {
    '67e2e29328541a7b58d1ca11': 'IDFC 1',
    '67ed2c7b62b722c49a251e26': 'IDFC 1',
    '67e1a4b22191787a139a749f': 'IDFC 2',
    '67e2e1f928541a7b58d1c9f8': 'IDFC 2',
    '67ed2be162b722c49a251dca': 'IDFC 2',
    '6841bef0b5a0fc5644db227d': 'IDFC 2',
    '6838102f710163091394b581': 'IDFC 2',
    '6841d8b5b5a0fc5644db5b10': 'IDFC 3',
    '6841d9b7b5a0fc5644db5b18': 'IDFC 4',
    '6841c13ab5a0fc5644db2f7e': 'IDFC 1', // New branch, default to IDFC 1 for UPI
    '67ea89f5524fad83e386415b': 'IDFC 1'  // New branch, default to IDFC 1 for UPI
  },
  'Credit Card': {
    '67e2e29328541a7b58d1ca11': 'IDFC 1',
    '67ed2c7b62b722c49a251e26': 'IDFC 1',
    '67e1a4b22191787a139a749f': 'IDFC 2',
    '67e2e1f928541a7b58d1c9f8': 'IDFC 2',
    '67ed2be162b722c49a251dca': 'IDFC 2',
    '6841bef0b5a0fc5644db227d': 'IDFC 2',
    '6838102f710163091394b581': 'IDFC 2',
    '6841d8b5b5a0fc5644db5b10': 'IDFC 3',
    '6841d9b7b5a0fc5644db5b18': 'IDFC 4',
    '6841c13ab5a0fc5644db2f7e': 'IDFC 1', // New branch, default to IDFC 1 for Credit Card
    '67ea89f5524fad83e386415b': 'IDFC 1'  // New branch, default to IDFC 1 for Credit Card
  },
};

// Blackforest branch IDs for pooled cash logic
const blackforestBranchIds = [
  '67e2e29328541a7b58d1ca11',
  '67ed2c7b62b722c49a251e26',
  '67e1a4b22191787a139a749f',
  '67e2e1f928541a7b58d1c9f8',
  '67ed2be162b722c49a251dca',
  '6841bef0b5a0fc5644db227d',
  '6838102f710163091394b581',
  '6841c13ab5a0fc5644db2f7e', // New branch
  '67ea89f5524fad83e386415b'  // New branch
];

// Initialize the financial document
const initializeFinancial = async () => {
  const result = await Financial.findOneAndUpdate(
    {},
    {
      $setOnInsert: {
        idfc1Balance: 0,
        idfc2Balance: 0,
        idfc3Balance: 0,
        idfc4Balance: 0,
        branchBalances: [],
        totalCashBalance: 0,
        transactions: [],
        lastUpdated: Date.now(),
      },
    },
    { upsert: true, new: true }
  );
  console.log('Financial document initialized or found:', result._id);
};

// Get all balances
const getBalances = async (req, res) => {
  try {
    await initializeFinancial();
    const financial = await Financial.findOne().populate('branchBalances.branch', 'name');
    if (!financial) {
      return res.status(404).json({ message: 'Financial data not found' });
    }
    const balances = [
      { source: 'IDFC 1', balance: financial.idfc1Balance },
      { source: 'IDFC 2', balance: financial.idfc2Balance },
      { source: 'IDFC 3', balance: financial.idfc3Balance },
      { source: 'IDFC 4', balance: financial.idfc4Balance },
      ...financial.branchBalances.map((bb) => ({
        source: `CASH IN HAND - ${bb.branch.name}`,
        branchId: bb.branch._id,
        balance: bb.cashBalance,
      })),
      { source: 'TOTAL CASH IN HAND', balance: financial.totalCashBalance },
    ];
    res.status(200).json(balances);
  } catch (err) {
    console.error('Error fetching balances:', err);
    res.status(500).json({ message: 'Server error while fetching balances' });
  }
};

// Get all transactions
const getTransactions = async (req, res) => {
  try {
    await initializeFinancial();
    const financial = await Financial.findOne().populate('transactions.branch', 'name');
    if (!financial) {
      return res.status(404).json({ message: 'Financial data not found' });
    }
    res.status(200).json(financial.transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
};

// Record a deposit
const recordDeposit = async (req, res) => {
  const { source, amount, branch, remarks, date } = req.body;

  console.log('Deposit request body:', { source, amount, branch, remarks, date });

  if (source === undefined || source === null || amount === undefined || amount === null || branch === undefined || branch === null) {
    return res.status(400).json({ message: 'Source, amount, and branch are required' });
  }

  if (amount <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than 0' });
  }

  let transactionSource = source;
  if (source === 'UPI' || source === 'Credit Card') {
    transactionSource = bankBranchMapping[source][branch];
    if (!transactionSource) {
      return res.status(400).json({ message: `No bank mapping for ${source} at branch ${branch}` });
    }
  } else if (source !== 'CASH IN HAND' && !bankBranchMapping[source]?.includes(branch)) {
    return res.status(400).json({ message: `Selected branch is not valid for ${source}` });
  }

  try {
    await initializeFinancial();
    const financial = await Financial.findOne();
    if (!financial) {
      return res.status(404).json({ message: 'Financial data not found' });
    }

    let updatedBalance;
    if (source === 'CASH IN HAND') {
      const branchId = new mongoose.Types.ObjectId(branch);
      let branchBalanceIndex = financial.branchBalances.findIndex(bb => bb.branch.toString() === branch);
      if (branchBalanceIndex === -1) {
        financial.branchBalances.push({ branch: branchId, cashBalance: 0 });
        branchBalanceIndex = financial.branchBalances.length - 1;
      }
      financial.branchBalances[branchBalanceIndex].cashBalance += amount;
      financial.markModified('branchBalances');
      financial.totalCashBalance += amount;
      updatedBalance = financial.branchBalances[branchBalanceIndex].cashBalance;
    } else {
      const bank = transactionSource;
      switch (bank) {
        case 'IDFC 1':
          financial.idfc1Balance += amount;
          updatedBalance = financial.idfc1Balance;
          break;
        case 'IDFC 2':
          financial.idfc2Balance += amount;
          updatedBalance = financial.idfc2Balance;
          break;
        case 'IDFC 3':
          financial.idfc3Balance += amount;
          updatedBalance = financial.idfc3Balance;
          break;
        case 'IDFC 4':
          financial.idfc4Balance += amount;
          updatedBalance = financial.idfc4Balance;
          break;
        default:
          return res.status(400).json({ message: 'Invalid source' });
      }
    }

    const transaction = {
      type: 'Credit - Deposit',
      source: transactionSource,
      branch: new mongoose.Types.ObjectId(branch),
      amount,
      expenseCategory: 'N/A',
      remarks: remarks || 'N/A',
      date: date ? new Date(date) : new Date(),
    };

    financial.transactions.push(transaction);
    financial.lastUpdated = Date.now();

    await financial.save();

    const populatedFinancial = await Financial.findOne()
      .populate('transactions.branch', 'name')
      .select('transactions');
    const populatedTransaction = populatedFinancial.transactions[populatedFinancial.transactions.length - 1];

    const balanceResponse = { source: transactionSource, balance: updatedBalance, branch };

    res.status(201).json({ balance: balanceResponse, transaction: populatedTransaction });
  } catch (err) {
    console.error('Error recording deposit:', err);
    res.status(500).json({ message: 'Server error while recording deposit' });
  }
};

// Record an expense
const recordExpense = async (req, res) => {
  const { source, amount, branch, remarks, category, date } = req.body;

  console.log('Expense request body:', { source, amount, branch, remarks, category, date });

  if (source === undefined || source === null || amount === undefined || amount === null || 
      branch === undefined || branch === null || category === undefined || category === null) {
    return res.status(400).json({ message: 'Source, amount, branch, and category are required' });
  }

  if (amount <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than 0' });
  }

  let transactionSource = source;
  if (source === 'UPI' || source === 'Credit Card') {
    transactionSource = bankBranchMapping[source][branch];
    if (!transactionSource) {
      return res.status(400).json({ message: `No bank mapping for ${source} at branch ${branch}` });
    }
  } else if (source !== 'CASH IN HAND' && !bankBranchMapping[source]?.includes(branch)) {
    return res.status(400).json({ message: `Selected branch is not valid for ${source}` });
  }

  try {
    await initializeFinancial();
    const financial = await Financial.findOne();
    if (!financial) {
      return res.status(404).json({ message: 'Financial data not found' });
    }

    let updatedBalance;
    if (source === 'CASH IN HAND') {
      if (blackforestBranchIds.includes(branch)) {
        // Deduct only from totalCashBalance for Blackforest branches and update it
        if (amount > financial.totalCashBalance) {
          return res.status(400).json({ message: 'Insufficient total cash balance for Blackforest group' });
        }
        financial.totalCashBalance -= amount;
        updatedBalance = financial.totalCashBalance; // Return updated totalCashBalance
      } else {
        // Standard per-branch logic for non-Blackforest branches
        const branchId = new mongoose.Types.ObjectId(branch);
        let branchBalanceIndex = financial.branchBalances.findIndex(bb => bb.branch.toString() === branch);
        if (branchBalanceIndex === -1) {
          financial.branchBalances.push({ branch: branchId, cashBalance: 0 });
          branchBalanceIndex = financial.branchBalances.length - 1;
        }
        if (financial.branchBalances[branchBalanceIndex].cashBalance < amount) {
          return res.status(400).json({ message: `Insufficient balance in CASH IN HAND for branch ${branch}` });
        }
        financial.branchBalances[branchBalanceIndex].cashBalance -= amount;
        financial.markModified('branchBalances');
        financial.totalCashBalance -= amount;
        updatedBalance = financial.branchBalances[branchBalanceIndex].cashBalance;
      }
    } else {
      const bank = transactionSource;
      switch (bank) {
        case 'IDFC 1':
          if (amount > financial.idfc1Balance) {
            return res.status(400).json({ message: 'Insufficient balance in IDFC 1' });
          }
          financial.idfc1Balance -= amount;
          updatedBalance = financial.idfc1Balance;
          break;
        case 'IDFC 2':
          if (amount > financial.idfc2Balance) {
            return res.status(400).json({ message: 'Insufficient balance in IDFC 2' });
          }
          financial.idfc2Balance -= amount;
          updatedBalance = financial.idfc2Balance;
          break;
        case 'IDFC 3':
          if (amount > financial.idfc3Balance) {
            return res.status(400).json({ message: 'Insufficient balance in IDFC 3' });
          }
          financial.idfc3Balance -= amount;
          updatedBalance = financial.idfc3Balance;
          break;
        case 'IDFC 4':
          if (amount > financial.idfc4Balance) {
            return res.status(400).json({ message: 'Insufficient balance in IDFC 4' });
          }
          financial.idfc4Balance -= amount;
          updatedBalance = financial.idfc4Balance;
          break;
        default:
          return res.status(400).json({ message: 'Invalid source' });
      }
    }

    const transaction = {
      type: 'Debit - Expense',
      source: transactionSource,
      branch: new mongoose.Types.ObjectId(branch),
      amount,
      expenseCategory: category,
      remarks: remarks || 'N/A',
      date: date ? new Date(date) : new Date(),
    };

    financial.transactions.push(transaction);
    financial.lastUpdated = Date.now();

    await financial.save();

    const populatedFinancial = await Financial.findOne()
      .populate('transactions.branch', 'name')
      .select('transactions');
    const populatedTransaction = populatedFinancial.transactions[populatedFinancial.transactions.length - 1];

    const balanceResponse = { source: transactionSource, balance: updatedBalance, branch };

    res.status(201).json({ balance: balanceResponse, transaction: populatedTransaction });
  } catch (err) {
    console.error('Error recording expense:', err);
    res.status(500).json({ message: 'Server error while recording expense' });
  }
};

module.exports = {
  getBalances,
  getTransactions,
  recordDeposit,
  recordExpense,
};