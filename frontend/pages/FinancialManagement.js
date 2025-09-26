import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Form, Select, InputNumber, Input, Button, Table, Space, DatePicker, message, Layout, Tabs } from 'antd';
import { BankOutlined, MoneyCollectOutlined, PrinterOutlined, ClearOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Bank to Branch mapping
const bankBranchMapping = {
  'IDFC 1': [
    '67e2e29328541a7b58d1ca11',
    '67ed2c7b62b722c49a251e26',
    '6841c13ab5a0fc5644db2f7e',
    '67ea89f5524fad83e386415b'
  ],
  'IDFC 2': [
    '67e1a4b22191787a139a749f',
    '67e2e1f928541a7b58d1c9f8',
    '67ed2be162b722c49a251dca',
    '6841bef0b5a0fc5644db227d',
    '6838102f710163091394b581',
    '6841c13ab5a0fc5644db2f7e',
    '67ea89f5524fad83e386415b'
  ],
  'IDFC 3': ['6841d8b5b5a0fc5644db5b10'],
  'IDFC 4': ['6841d9b7b5a0fc5644db5b18'],
};

// Group to Branch/Bank mapping
const groupMapping = {
  thoothukudiHotel: {
    name: 'Thoothukudi Hotel',
    banks: ['IDFC 4'],
    branchIds: ['6841d9b7b5a0fc5644db5b18'],
  },
  thoothukudiMacroon: {
    name: 'Thoothukudi Macroon',
    banks: ['IDFC 3'],
    branchIds: ['6841d8b5b5a0fc5644db5b10'],
  },
  blackforestCakes: {
    name: 'Blackforest Cakes',
    banks: ['IDFC 1', 'IDFC 2'],
    branchIds: [
      '67e2e29328541a7b58d1ca11',
      '67ed2c7b62b722c49a251e26',
      '67e1a4b22191787a139a749f',
      '67e2e1f928541a7b58d1c9f8',
      '67ed2be162b722c49a251dca',
      '6841bef0b5a0fc5644db227d',
      '6838102f710163091394b581',
      '6841c13ab5a0fc5644db2f7e',
      '67ea89f5524fad83e386415b'
    ],
  },
};

const FinancialManagement = () => {
  // State for balances
  const [idfc1Balance, setIdfc1Balance] = useState(0);
  const [idfc2Balance, setIdfc2Balance] = useState(0);
  const [idfc3Balance, setIdfc3Balance] = useState(0);
  const [idfc4Balance, setIdfc4Balance] = useState(0);
  const [branchBalances, setBranchBalances] = useState([]);
  const [cashTotals, setCashTotals] = useState({
    thoothukudiHotel: 0,
    thoothukudiMacroon: 0,
    blackforestCakes: 0,
    total: 0,
  });

  // State for transactions and filters
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedSourceFilter, setSelectedSourceFilter] = useState(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('total');

  // Form instances
  const [depositForm] = Form.useForm();
  const [expenseForm] = Form.useForm();

  const router = useRouter();
  const BACKEND_URL = 'http://localhost:5001';

  // Fetch initial data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.info('Please log in to access the page');
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (!['superadmin', 'admin'].includes(decoded.role)) {
        message.error('Access restricted to superadmin or admin');
        router.push('/login');
        return;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      message.error('Invalid token, please log in again');
      router.push('/login');
      return;
    }

    fetchBalances();
    fetchTransactions();
    fetchBranches();
  }, [router]);

  // Set default branch and date values in forms
  useEffect(() => {
    if (branches.length > 0) {
      depositForm.setFieldsValue({ branch: undefined, date: dayjs() });
      expenseForm.setFieldsValue({ branch: undefined, date: dayjs() });
    }
  }, [branches, depositForm, expenseForm]);

  // Filter transactions when filters or group change
  useEffect(() => {
    filterTransactions(selectedSourceFilter, selectedTypeFilter, selectedDateRange, selectedBranchFilter, selectedGroup);
  }, [transactions, selectedSourceFilter, selectedTypeFilter, selectedDateRange, selectedBranchFilter, selectedGroup]);

  // Fetch balances
  const fetchBalances = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/financial/balances`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      console.log('fetchBalances response:', result);
      if (response.ok) {
        setBranchBalances([]);
        let newCashTotals = {
          thoothukudiHotel: 0,
          thoothukudiMacroon: 0,
          blackforestCakes: 0,
          total: 0,
        };
        let nonBlackforestSum = 0;
        result.forEach((balance) => {
          switch (balance.source) {
            case 'IDFC 1':
              setIdfc1Balance(balance.balance);
              break;
            case 'IDFC 2':
              setIdfc2Balance(balance.balance);
              break;
            case 'IDFC 3':
              setIdfc3Balance(balance.balance);
              break;
            case 'IDFC 4':
              setIdfc4Balance(balance.balance);
              break;
            case 'TOTAL CASH IN HAND':
              newCashTotals.total = balance.balance;
              break;
            default:
              if (balance.source.startsWith('CASH IN HAND - ')) {
                setBranchBalances((prev) => {
                  const existing = prev.find(bb => bb.branchId === balance.branchId);
                  if (existing) {
                    return prev.map(bb => bb.branchId === balance.branchId ? { ...bb, balance: balance.balance } : bb);
                  }
                  return [...prev, { branchId: balance.branchId, source: balance.source, balance: balance.balance }];
                });
                // Update group-specific cash totals
                if (groupMapping.thoothukudiHotel.branchIds.includes(balance.branchId)) {
                  newCashTotals.thoothukudiHotel += balance.balance;
                  nonBlackforestSum += balance.balance;
                } else if (groupMapping.thoothukudiMacroon.branchIds.includes(balance.branchId)) {
                  newCashTotals.thoothukudiMacroon += balance.balance;
                  nonBlackforestSum += balance.balance;
                } else if (groupMapping.blackforestCakes.branchIds.includes(balance.branchId)) {
                  newCashTotals.blackforestCakes += balance.balance;
                }
              }
              break;
          }
        });
        // Adjust Blackforest total as total - nonBlackforestSum
        newCashTotals.blackforestCakes = newCashTotals.total - nonBlackforestSum;
        console.log('fetchBalances newCashTotals:', newCashTotals);
        setCashTotals(newCashTotals);
      } else {
        message.error(result.message || 'Failed to fetch balances');
      }
    } catch (err) {
      message.error('Server error while fetching balances');
      console.error('Error:', err);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/financial/transactions`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        const formattedTransactions = result.map((t) => ({
          id: t._id,
          date: t.date,
          type: t.type,
          source: t.source,
          branch: t.branch?.name || 'N/A',
          branchId: t.branch?._id,
          amount: t.amount,
          expenseCategory: t.expenseCategory,
          remarks: t.remarks,
        }));
        setTransactions(formattedTransactions);
        setFilteredTransactions(formattedTransactions);
      } else {
        message.error(result.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      message.error('Server error while fetching transactions');
      console.error('Error:', err);
    }
  };

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/branches/public`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        setBranches(result);
      } else {
        message.error('Failed to fetch branches');
      }
    } catch (err) {
      message.error('Server error while fetching branches');
      console.error('Error:', err);
    }
  };

  // Custom validator for amount
  const validateAmount = (_, value) => {
    if (value === undefined || value === null) {
      return Promise.reject(new Error('Please enter an amount'));
    }
    if (typeof value !== 'number') {
      return Promise.reject(new Error('Amount must be a number'));
    }
    if (value < 1) {
      return Promise.reject(new Error('Amount must be at least 1'));
    }
    return Promise.resolve();
  };

  // Custom validator for expense amount against balance
  const validateExpenseAmount = async (_, value, branchId, source) => {
    if (value === undefined || value === null) {
      return Promise.reject(new Error('Please enter an amount'));
    }
    if (typeof value !== 'number') {
      return Promise.reject(new Error('Amount must be a number'));
    }
    if (value < 1) {
      return Promise.reject(new Error('Amount must be at least 1'));
    }
    if (source === 'CASH IN HAND' && branchId) {
      if (selectedGroup === 'blackforestCakes') {
        // Validate against Blackforest group cash total
        if (value > cashTotals.blackforestCakes) {
          return Promise.reject(new Error('Insufficient total cash balance for Blackforest group'));
        }
      } else {
        const branchBalance = branchBalances.find(bb => bb.branchId === branchId)?.balance || 0;
        if (value > branchBalance) {
          return Promise.reject(new Error('Insufficient cash balance for this branch'));
        }
      }
    } else {
      let bankBalance = 0;
      switch (source) {
        case 'IDFC 1':
          bankBalance = idfc1Balance;
          break;
        case 'IDFC 2':
          bankBalance = idfc2Balance;
          break;
        case 'IDFC 3':
          bankBalance = idfc3Balance;
          break;
        case 'IDFC 4':
          bankBalance = idfc4Balance;
          break;
        default:
          break;
      }
      if (value > bankBalance) {
        return Promise.reject(new Error(`Insufficient balance in ${source}`));
      }
    }
    return Promise.resolve();
  };

  // Custom validator for branch based on selected bank
  const validateBranchForBank = (_, value, source) => {
    if (!value) {
      return Promise.reject(new Error('Please select a branch'));
    }
    if (source !== 'CASH IN HAND' && bankBranchMapping[source] && !bankBranchMapping[source].includes(value)) {
      return Promise.reject(new Error(`Selected branch is not valid for ${source}`));
    }
    return Promise.resolve();
  };

  // Handle deposit form submission
  const handleDeposit = async (values) => {
    const { source, amount, branch, remarks, date } = values;

    console.log('Deposit form values:', { source, amount, branch, remarks, date });

    try {
      const response = await fetch(`${BACKEND_URL}/api/financial/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, amount, branch, remarks, date: date ? date.toISOString() : null }),
      });
      const result = await response.json();
      if (response.ok) {
        if (source === 'CASH IN HAND') {
          setBranchBalances((prev) => {
            const existing = prev.find(bb => bb.branchId === result.balance.branch);
            if (existing) {
              return prev.map(bb => bb.branchId === result.balance.branch ? { ...bb, balance: result.balance.balance } : bb);
            }
            const branchName = branches.find(b => b._id === result.balance.branch)?.name || 'Unknown Branch';
            return [...prev, { branchId: result.balance.branch, source: `CASH IN HAND - ${branchName}`, balance: result.balance.balance }];
          });
          setCashTotals((prev) => {
            const newTotals = { ...prev };
            if (groupMapping.thoothukudiHotel.branchIds.includes(branch)) {
              newTotals.thoothukudiHotel += amount;
            } else if (groupMapping.thoothukudiMacroon.branchIds.includes(branch)) {
              newTotals.thoothukudiMacroon += amount;
            } else if (groupMapping.blackforestCakes.branchIds.includes(branch)) {
              newTotals.blackforestCakes += amount;
            }
            newTotals.total += amount;
            return newTotals;
          });
        } else {
          switch (source) {
            case 'IDFC 1':
              setIdfc1Balance(result.balance.balance);
              break;
            case 'IDFC 2':
              setIdfc2Balance(result.balance.balance);
              break;
            case 'IDFC 3':
              setIdfc3Balance(result.balance.balance);
              break;
            case 'IDFC 4':
              setIdfc4Balance(result.balance.balance);
              break;
            default:
              break;
          }
        }

        const newTransaction = {
          id: result.transaction._id,
          date: result.transaction.date,
          type: result.transaction.type,
          source: result.transaction.source,
          branch: result.transaction.branch?.name || 'N/A',
          branchId: result.transaction.branch?._id,
          amount: result.transaction.amount,
          expenseCategory: result.transaction.expenseCategory,
          remarks: result.transaction.remarks,
        };
        setTransactions((prev) => [...prev, newTransaction]);
        setFilteredTransactions((prev) => [...prev, newTransaction]);

        message.success('Deposit recorded successfully');
        depositForm.resetFields();
        depositForm.setFieldsValue({ date: dayjs() });
      } else {
        message.error(result.message || 'Failed to record deposit');
      }
    } catch (err) {
      message.error('Server error while recording deposit');
      console.error('Error:', err);
    }
  };

  // Handle expense form submission
  const handleExpense = async (values) => {
    const { source, category, amount, branch, remarks, date } = values;

    console.log('Expense form values:', { source, category, amount, branch, remarks, date });
    console.log('Is Blackforest branch?', groupMapping.blackforestCakes.branchIds.includes(branch), 'Branch ID:', branch);
    console.log('Blackforest branch IDs:', groupMapping.blackforestCakes.branchIds);

    try {
      const response = await fetch(`${BACKEND_URL}/api/financial/expense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, category, amount, branch: branch.toString(), remarks, date: date ? date.toISOString() : null }),
      });
      const result = await response.json();
      console.log('Backend response:', result);

      if (response.ok) {
        if (source === 'CASH IN HAND') {
          const branchId = branch.toString();
          if (groupMapping.blackforestCakes.branchIds.includes(branchId)) {
            console.log('Updating Blackforest cash total. Previous cashTotals:', cashTotals);
            console.log('New totalCashBalance from backend:', result.balance.balance);
            setCashTotals((prev) => {
              const newTotals = {
                ...prev,
                blackforestCakes: prev.blackforestCakes - amount,
                total: prev.total - amount,
              };
              console.log('New cashTotals:', newTotals);
              return newTotals;
            });
            await fetchBalances();
            message.success(`Expense recorded. Blackforest Total: ₹${(cashTotals.blackforestCakes - amount).toFixed(2)}`);
          } else {
            setBranchBalances((prev) => {
              const existing = prev.find(bb => bb.branchId === result.balance.branch);
              if (existing) {
                return prev.map(bb => bb.branchId === result.balance.branch ? { ...bb, balance: result.balance.balance } : bb);
              }
              const branchName = branches.find(b => b._id === result.balance.branch)?.name || 'Unknown Branch';
              return [...prev, { branchId: result.balance.branch, source: `CASH IN HAND - ${branchName}`, balance: result.balance.balance }];
            });
            setCashTotals((prev) => {
              const newTotals = { ...prev };
              if (groupMapping.thoothukudiHotel.branchIds.includes(branchId)) {
                newTotals.thoothukudiHotel -= amount;
              } else if (groupMapping.thoothukudiMacroon.branchIds.includes(branchId)) {
                newTotals.thoothukudiMacroon -= amount;
              }
              newTotals.total -= amount;
              console.log('Non-Blackforest cashTotals update:', newTotals);
              return newTotals;
            });
          }
        } else {
          switch (source) {
            case 'IDFC 1':
              setIdfc1Balance(result.balance.balance);
              break;
            case 'IDFC 2':
              setIdfc2Balance(result.balance.balance);
              break;
            case 'IDFC 3':
              setIdfc3Balance(result.balance.balance);
              break;
            case 'IDFC 4':
              setIdfc4Balance(result.balance.balance);
              break;
            default:
              break;
          }
        }

        const newTransaction = {
          id: result.transaction._id,
          date: result.transaction.date,
          type: result.transaction.type,
          source: result.transaction.source,
          branch: result.transaction.branch?.name || 'N/A',
          branchId: result.transaction.branch?._id,
          amount: result.transaction.amount,
          expenseCategory: result.transaction.expenseCategory,
          remarks: result.transaction.remarks,
        };
        setTransactions((prev) => [...prev, newTransaction]);
        setFilteredTransactions((prev) => [...prev, newTransaction]);

        message.success('Expense recorded successfully');
        expenseForm.resetFields();
        expenseForm.setFieldsValue({ date: dayjs() });
      } else {
        message.error(result.message || 'Failed to record expense');
      }
    } catch (err) {
      message.error('Server error while recording expense');
      console.error('Error:', err);
    }
  };

  // Calculate total amount for filtered transactions
  const calculateTransactionTotal = () => {
    return filteredTransactions.reduce((total, t) => {
      if (t.type === 'Credit - Deposit') {
        return total + t.amount;
      } else if (t.type === 'Debit - Expense') {
        return total - t.amount;
      }
      return total;
    }, 0);
  };

  // Calculate running balance for a transaction
  const calculateRunningBalance = (index) => {
    return filteredTransactions
      .slice(0, index + 1)
      .reduce((balance, t) => {
        if (t.type === 'Credit - Deposit') {
          return balance + t.amount;
        } else if (t.type === 'Debit - Expense') {
          return balance - t.amount;
        }
        return balance;
      }, 0);
  };

  // Filter transactions
  const filterTransactions = (source, type, dateRange, branchFilter, group) => {
    let filtered = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (group !== 'total') {
      const groupConfig = groupMapping[group];
      filtered = filtered.filter((t) => groupConfig.branchIds.includes(t.branchId));
    }

    if (branchFilter) {
      if (branchFilter === 'blackforestGroup') {
        filtered = filtered.filter((t) => groupMapping.blackforestCakes.branchIds.includes(t.branchId));
      } else {
        filtered = filtered.filter((t) => t.branchId === branchFilter);
      }
    }

    if (source) {
      filtered = filtered.filter((t) => t.source === source || t.source.startsWith('CASH IN HAND - '));
    }

    if (type) {
      filtered = filtered.filter((t) => t.type === type);
    }

    if (dateRange && dateRange.length === 2) {
      const startDate = dayjs(dateRange[0]).startOf('day');
      const endDate = dayjs(dateRange[1]).endOf('day');
      filtered = filtered.filter((t) => {
        const transactionDate = dayjs(t.date);
        return transactionDate.isValid() && transactionDate.isBetween(startDate, endDate, null, '[]');
      });
    }

    setFilteredTransactions(filtered);
  };

  const handleSourceFilter = (value) => {
    setSelectedSourceFilter(value);
    filterTransactions(value, selectedTypeFilter, selectedDateRange, selectedBranchFilter, selectedGroup);
  };

  const handleTypeFilter = (value) => {
    setSelectedTypeFilter(value);
    filterTransactions(selectedSourceFilter, value, selectedDateRange, selectedBranchFilter, selectedGroup);
  };

  const handleDateFilter = (dates) => {
    setSelectedDateRange(dates);
    filterTransactions(selectedSourceFilter, selectedTypeFilter, dates, selectedBranchFilter, selectedGroup);
  };

  const handleBranchFilter = (value) => {
    setSelectedBranchFilter(value);
    filterTransactions(selectedSourceFilter, selectedTypeFilter, selectedDateRange, value, selectedGroup);
  };

  const clearFilters = () => {
    setSelectedSourceFilter(null);
    setSelectedTypeFilter(null);
    setSelectedDateRange(null);
    setSelectedBranchFilter(null);
    filterTransactions(null, null, null, null, selectedGroup);
  };

  const handlePrint = () => {
    const groupName = selectedGroup === 'total' ? 'Total' : groupMapping[selectedGroup].name;
    const printContent = `
      <html>
        <head>
          <title>Transaction History - ${groupName}</title>
          <style>
            @media print {
              @page { size: A4; margin: 20mm; }
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .no-print { display: none; }
              .total-row { font-weight: bold; }
            }
          </style>
        </head>
        <body>
          <h1>Transaction History - ${groupName}</h1>
          <table>
            <thead>
              <tr>
                <th>Serial No</th>
                <th>Date</th>
                <th>Type</th>
                <th>Source</th>
                <th>Branch</th>
                <th>Amount (₹)</th>
                <th>Current Balance (₹)</th>
                <th>Expense Category</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions
                .map(
                  (t, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${dayjs(t.date).local().format('YYYY-MM-DD HH:mm:ss')}</td>
                      <td>${t.type}</td>
                      <td>${t.source}</td>
                      <td>${t.branch}</td>
                      <td>₹${t.amount.toFixed(2)}</td>
                      <td>₹${calculateRunningBalance(index).toFixed(2)}</td>
                      <td>${t.expenseCategory}</td>
                      <td>${t.remarks}</td>
                    </tr>
                  `
                )
                .join('')}
              <tr class="total-row">
                <td colspan="5">Total</td>
                <td>₹${calculateTransactionTotal().toFixed(2)}</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const columns = [
    {
      title: 'Serial No',
      key: 'serial_no',
      render: (_, __, index) => index + 1,
      width: 80,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).local().format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: 'Branch',
      dataIndex: 'branch',
      key: 'branch',
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Current Balance (₹)',
      key: 'currentBalance',
      render: (_, __, index) => `₹${calculateRunningBalance(index).toFixed(2)}`,
    },
    {
      title: 'Expense Category',
      dataIndex: 'expenseCategory',
      key: 'expenseCategory',
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
    },
  ];

  // Filter balances by group
  const getFilteredBalances = () => {
    if (selectedGroup === 'total') {
      return [
        { source: 'IDFC 1', balance: idfc1Balance },
        { source: 'IDFC 2', balance: idfc2Balance },
        { source: 'IDFC 3', balance: idfc3Balance },
        { source: 'IDFC 4', balance: idfc4Balance },
        ...branchBalances,
        { source: 'TOTAL CASH IN HAND', balance: cashTotals.total },
      ];
    }
    const groupConfig = groupMapping[selectedGroup];
    const filteredBanks = groupConfig.banks.map((bank) => ({
      source: bank,
      balance: bank === 'IDFC 1' ? idfc1Balance : bank === 'IDFC 2' ? idfc2Balance : bank === 'IDFC 3' ? idfc3Balance : idfc4Balance,
    }));
    const cashBalances = branchBalances.filter((bb) => groupConfig.branchIds.includes(bb.branchId));
    if (selectedGroup === 'blackforestCakes') {
      return [
        ...filteredBanks,
        { source: 'CASH IN HAND - Blackforest Cakes Total', balance: cashTotals.blackforestCakes },
      ];
    }
    return [
      ...filteredBanks,
      ...cashBalances.map((bb) => ({
        source: bb.source,
        branchId: bb.branchId,
        balance: bb.balance,
      })),
      { source: `CASH IN HAND - ${groupConfig.name} Total`, balance: cashTotals[selectedGroup] },
    ];
  };

  // Get available sources for forms based on group
  const getAvailableSources = () => {
    if (selectedGroup === 'total') {
      return ['IDFC 1', 'IDFC 2', 'IDFC 3', 'IDFC 4', 'CASH IN HAND'];
    }
    return [...groupMapping[selectedGroup].banks, 'CASH IN HAND'];
  };

  // Get available branches for forms based on group
  const getAvailableBranches = () => {
    if (selectedGroup === 'total') {
      return branches;
    }
    return branches.filter((branch) => groupMapping[selectedGroup].branchIds.includes(branch._id));
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <div
        style={{
          padding: '40px 20px',
          background: 'linear-gradient(to bottom, #f0f2f5, #e6e9f0)',
          minHeight: 'calc(100vh - 64px)',
          marginTop: '64px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ maxWidth: '1200px', width: '100%' }}>
          <Title
            level={2}
            style={{
              marginBottom: '20px',
              color: '#1a3042',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            Financial Management {selectedGroup === 'total' ? '' : `- ${groupMapping[selectedGroup].name}`}
          </Title>

          <Tabs
            activeKey={selectedGroup}
            onChange={setSelectedGroup}
            items={[
              { key: 'total', label: 'Total' },
              { key: 'thoothukudiHotel', label: 'Thoothukudi Hotel' },
              { key: 'thoothukudiMacroon', label: 'Thoothukudi Macroon' },
              { key: 'blackforestCakes', label: 'Blackforest Cakes' },
            ]}
            style={{ marginBottom: '40px' }}
          />

          <Title level={4} style={{ marginBottom: '20px', color: '#1a3042' }}>
            Current Balances
          </Title>
          <Row gutter={[24, 24]} style={{ marginBottom: '40px' }} key={selectedGroup + cashTotals[selectedGroup]}>
            {getFilteredBalances().map((balance) => (
              <Col xs={24} sm={12} md={6} key={balance.source}>
                <Card
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    height: '150px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  {balance.source.startsWith('CASH IN HAND') || balance.source.includes('Total') ? (
                    <MoneyCollectOutlined style={{ fontSize: '24px', color: '#1a3042' }} />
                  ) : (
                    <BankOutlined style={{ fontSize: '24px', color: '#1a3042' }} />
                  )}
                  <Text strong style={{ fontSize: '18px', display: 'block', marginTop: '10px' }}>
                    {balance.source}: ₹{balance.balance.toFixed(2)}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>

          <Title level={4} style={{ marginBottom: '20px', color: '#1a3042' }}>
            Deposit Funds
          </Title>
          <Card
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              marginBottom: '40px',
            }}
          >
            <Form
              form={depositForm}
              layout="vertical"
              onFinish={handleDeposit}
              style={{ maxWidth: '600px', margin: '0 auto' }}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Source"
                    name="source"
                    rules={[{ required: true, message: 'Please select a source' }]}
                  >
                    <Select
                      placeholder="Select Source"
                      onChange={(value) => {
                        depositForm.setFieldsValue({ branch: undefined });
                      }}
                    >
                      {getAvailableSources().map((source) => (
                        <Option key={source} value={source}>
                          {source}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Amount (₹)"
                    name="amount"
                    rules={[{ validator: validateAmount }]}
                  >
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => prevValues.source !== currentValues.source}
                  >
                    {({ getFieldValue }) => {
                      const source = getFieldValue('source');
                      return (
                        <Form.Item
                          label="Branch"
                          name="branch"
                          rules={[{ validator: (_, value) => validateBranchForBank(_, value, source) }]}
                        >
                          <Select placeholder="Select Branch">
                            {source && bankBranchMapping[source] && source !== 'CASH IN HAND'
                              ? getAvailableBranches()
                                  .filter((branch) => bankBranchMapping[source].includes(branch._id))
                                  .map((branch) => (
                                    <Option key={branch._id} value={branch._id}>
                                      {branch.name}
                                    </Option>
                                  ))
                              : getAvailableBranches().map((branch) => (
                                  <Option key={branch._id} value={branch._id}>
                                    {branch.name}
                                  </Option>
                                ))}
                          </Select>
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Date"
                    name="date"
                    rules={[{ required: true, message: 'Please select a date' }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" defaultValue={dayjs()} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Remarks" name="remarks">
                    <Input placeholder="Optional remarks" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                  Deposit
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Title level={4} style={{ marginBottom: '20px', color: '#1a3042' }}>
            Record Expense
          </Title>
          <Card
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              marginBottom: '40px',
            }}
          >
            <Form
              form={expenseForm}
              layout="vertical"
              onFinish={handleExpense}
              style={{ maxWidth: '600px', margin: '0 auto' }}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Payment Source"
                    name="source"
                    rules={[{ required: true, message: 'Please select a payment source' }]}
                  >
                    <Select
                      placeholder="Select Source"
                      onChange={(value) => {
                        expenseForm.setFieldsValue({ branch: undefined });
                      }}
                    >
                      {getAvailableSources().map((source) => (
                        <Option key={source} value={source}>
                          {source}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Expense Category"
                    name="category"
                    rules={[{ required: true, message: 'Please select an expense category' }]}
                  >
                    <Select placeholder="Select Category">
                      <Option value="Rent">Rent</Option>
                      <Option value="EB">EB</Option>
                      <Option value="MAINTENANCE">Maintenance</Option>
                      <Option value="TRANSPORT">Transport</Option>
                      <Option value="FUEL">Fuel</Option>
                      <Option value="PACKING">Packing</Option>
                      <Option value="STAFF WELFARE">Staff Welfare</Option>
                      <Option value="ADVERTISEMENT">Advertisement</Option>
                      <Option value="ADVANCE">Advance</Option>
                      <Option value="COMPLEMENTARY">Complementary</Option>
                      <Option value="RAW MATERIAL">RAW MATERIAL</Option>
                      <Option value="SALARY">SALARY</Option>
                      <Option value="OC PRODUCTS">OC PRODUCTS</Option>
                      <Option value="OTHERS">Others</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => prevValues.branch !== currentValues.branch || prevValues.source !== currentValues.source}
                  >
                    {({ getFieldValue }) => {
                      const branchId = getFieldValue('branch');
                      const source = getFieldValue('source');
                      return (
                        <Form.Item
                          label="Amount (₹)"
                          name="amount"
                          rules={[{ validator: (_, value) => validateExpenseAmount(_, value, branchId, source) }]}
                        >
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => prevValues.source !== currentValues.source}
                  >
                    {({ getFieldValue }) => {
                      const source = getFieldValue('source');
                      return (
                        <Form.Item
                          label="Branch"
                          name="branch"
                          rules={[{ validator: (_, value) => validateBranchForBank(_, value, source) }]}
                        >
                          <Select placeholder="Select Branch">
                            {source && bankBranchMapping[source] && source !== 'CASH IN HAND'
                              ? getAvailableBranches()
                                  .filter((branch) => bankBranchMapping[source].includes(branch._id))
                                  .map((branch) => (
                                    <Option key={branch._id} value={branch._id}>
                                      {branch.name}
                                    </Option>
                                  ))
                              : getAvailableBranches().map((branch) => (
                                  <Option key={branch._id} value={branch._id}>
                                    {branch.name}
                                  </Option>
                                ))}
                          </Select>
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Date"
                    name="date"
                    rules={[{ required: true, message: 'Please select a date' }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" defaultValue={dayjs()} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Remarks" name="remarks">
                    <Input placeholder="Optional remarks" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                  Record Expense
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Title level={4} style={{ marginBottom: '20px', color: '#1a3042' }}>
            Transaction History
          </Title>
          <Card
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              marginBottom: '40px',
            }}
          >
            <Space wrap style={{ marginBottom: '20px', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Text strong>Source</Text>
                <Select
                  placeholder="Filter by Source"
                  value={selectedSourceFilter}
                  onChange={handleSourceFilter}
                  allowClear
                  style={{ width: '200px' }}
                >
                  {getAvailableSources().map((source) => (
                    <Option key={source} value={source}>
                      {source}
                    </Option>
                  ))}
                </Select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Text strong>Branch</Text>
                <Select
                  placeholder="Filter by Branch"
                  value={selectedBranchFilter}
                  onChange={handleBranchFilter}
                  allowClear
                  style={{ width: '200px' }}
                >
                  <Option key="blackforestGroup" value="blackforestGroup">
                    Blackforest Group
                  </Option>
                  {getAvailableBranches().map((branch) => (
                    <Option key={branch._id} value={branch._id}>
                      {branch.name}
                    </Option>
                  ))}
                </Select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Text strong>Type</Text>
                <Select
                  placeholder="Filter by Type"
                  value={selectedTypeFilter}
                  onChange={handleTypeFilter}
                  allowClear
                  style={{ width: '200px' }}
                >
                  <Option value="Credit - Deposit">Credit - Deposit</Option>
                  <Option value="Debit - Expense">Debit - Expense</Option>
                </Select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Text strong>Date Range</Text>
                <RangePicker
                  value={selectedDateRange}
                  onChange={handleDateFilter}
                  format="YYYY-MM-DD"
                  style={{ width: '250px' }}
                />
              </div>
              <Space style={{ marginTop: '20px' }}>
                <Button icon={<PrinterOutlined />} onClick={handlePrint} />
                <Button type="default" icon={<ClearOutlined />} onClick={clearFilters}>
                  Reset
                </Button>
              </Space>
            </Space>

            <Table
              columns={columns}
              dataSource={filteredTransactions}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              bordered
              summary={() => (
                <Table.Summary.Row style={{ fontWeight: 'bold' }}>
                  <Table.Summary.Cell colSpan={5}>Total</Table.Summary.Cell>
                  <Table.Summary.Cell>₹{calculateTransactionTotal().toFixed(2)}</Table.Summary.Cell>
                  <Table.Summary.Cell />
                  <Table.Summary.Cell />
                  <Table.Summary.Cell />
                </Table.Summary.Row>
              )}
            />
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default FinancialManagement;