
import React, { useState, useEffect, useMemo } from 'react';
import { Table, Select, DatePicker, Button, Spin, Typography, Space, Card, Modal, Tooltip, Switch } from 'antd';
import { RedoOutlined, PrinterOutlined } from '@ant-design/icons';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useRouter } from "next/router";
import { jwtDecode } from "jwt-decode";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

ChartJS.register(LineElement, PointElement, ArcElement, BarElement, CategoryScale, LinearScale, ChartTooltip, Legend, ChartDataLabels);

const { Option } = Select;
const { Text } = Typography;
const { RangePicker } = DatePicker;

const ClosingEntryList = () => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [closingEntries, setClosingEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState('Today');
  const [customDateRange, setCustomDateRange] = useState(null);
  const [dateFilterType, setDateFilterType] = useState('Created');
  const [expenseFilter, setExpenseFilter] = useState(null);
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [expenseDetails, setExpenseDetails] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [modalTitle, setModalTitle] = useState('Expense Details');
  const [isCashModalVisible, setIsCashModalVisible] = useState(false);
  const [cashDetails, setCashDetails] = useState([]);
  const [cashModalTitle, setCashModalTitle] = useState('Cash Denomination Details');
  const [showSummaryTable, setShowSummaryTable] = useState(true);

  const expenseCategories = [
    'MAINTENANCE',
    'TRANSPORT',
    'FUEL',
    'PACKING',
    'STAFF WELFARE',
    'ADVERTISEMENT',
    'ADVANCE',
    'COMPLEMENTARY',
    'RAW MATERIAL',
    'SALARY',
    'OC PRODUCTS',
    'OTHERS',
  ];

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);

    if (!storedToken) {
      router.replace("/login");
      return;
    }

    try {
      const decoded = jwtDecode(storedToken);
      const role = decoded.role;
      if (!["admin", "superadmin"].includes(role)) {
        router.replace("/login");
        return;
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      router.replace("/login");
      return;
    }

    fetchBranches(storedToken);
    fetchClosingEntries(storedToken);
  }, [router]);

  useEffect(() => {
    let filtered = [...closingEntries];

    if (branchFilter) {
      filtered = filtered.filter((entry) => entry.branchId?._id === branchFilter);
    }

    if (dateFilter) {
      let startDate, endDate;
      const today = dayjs().tz('Asia/Kolkata').startOf('day');
      switch (dateFilter) {
        case 'Today':
          startDate = today;
          endDate = today.endOf('day');
          break;
        case 'Yesterday':
          startDate = today.subtract(1, 'day').startOf('day');
          endDate = today.subtract(1, 'day').endOf('day');
          break;
        case 'Last 7 Days':
          startDate = today.subtract(6, 'day').startOf('day');
          endDate = today.endOf('day');
          break;
        case 'Last 30 Days':
          startDate = today.subtract(29, 'day').startOf('day');
          endDate = today.endOf('day');
          break;
        case 'Custom':
          if (customDateRange && customDateRange.length === 2) {
            startDate = dayjs(customDateRange[0]).tz('Asia/Kolkata').startOf('day');
            endDate = dayjs(customDateRange[1]).tz('Asia/Kolkata').endOf('day');
          }
          break;
        default:
          break;
      }
      if (startDate && endDate) {
        filtered = filtered.filter((entry) => {
          const entryDate = dateFilterType === 'Created' ? dayjs(entry.createdAt).tz('Asia/Kolkata') : dayjs(entry.date).tz('Asia/Kolkata');
          return entryDate.isValid() && entryDate.isBetween(startDate, endDate, null, '[]');
        });
      }
    }

    if (expenseFilter) {
      filtered = filtered.filter((entry) =>
        entry.expenseDetails.some((detail) => detail.reason === expenseFilter)
      );
    }

    setFilteredEntries(filtered);
  }, [closingEntries, branchFilter, dateFilter, customDateRange, dateFilterType, expenseFilter]);

  const fetchBranches = async (token) => {
    try {
      const response = await fetch('http://localhost:5001/api/branches/public', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) {
        setBranches(result);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchClosingEntries = async (token) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/closing-entries', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) {
        setClosingEntries(result);
        setFilteredEntries(result);
      }
    } catch (err) {
      console.error('Error fetching closing entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewExpenses = (entry, branchName, date) => {
    setSelectedEntryId(entry._id || entry.branchId);
    const expenses = entry.expenseDetails || [];
    setExpenseDetails(expenses);
    const formattedDate = date ? dayjs(date).format('D/M/YY') : 'Summary';
    setModalTitle(`Expense Details for ${branchName || 'Unknown Branch'} ${date ? `on ${formattedDate}` : ''}`);
    setIsExpenseModalVisible(true);
  };

  const handleViewCash = (entry, branchName, index) => {
    const denominations = [
      { denom: '₹2000', count: entry.denom2000 || 0, amount: (entry.denom2000 || 0) * 2000 },
      { denom: '₹500', count: entry.denom500 || 0, amount: (entry.denom500 || 0) * 500 },
      { denom: '₹200', count: entry.denom200 || 0, amount: (entry.denom200 || 0) * 200 },
      { denom: '₹100', count: entry.denom100 || 0, amount: (entry.denom100 || 0) * 100 },
      { denom: '₹50', count: entry.denom50 || 0, amount: (entry.denom50 || 0) * 50 },
      { denom: '₹20', count: entry.denom20 || 0, amount: (entry.denom20 || 0) * 20 },
      { denom: '₹10', count: entry.denom10 || 0, amount: (entry.denom10 || 0) * 10 },
    ].filter((d) => d.count > 0);

    setCashDetails(denominations);
    setCashModalTitle(`Cash Denomination Details for ${branchName || 'Unknown Branch'} (Entry ${index + 1})`);
    setIsCashModalVisible(true);
  };

  const handleViewTotalCash = (totals, isSummaryTable) => {
    const entries = isSummaryTable ? closingEntries.filter((entry) =>
      filteredEntries.some((fe) => fe._id === entry._id)
    ) : filteredEntries;

    const denomTotals = entries.reduce(
      (acc, entry) => {
        acc.denom2000 += entry.denom2000 || 0;
        acc.denom500 += entry.denom500 || 0;
        acc.denom200 += entry.denom200 || 0;
        acc.denom100 += entry.denom100 || 0;
        acc.denom50 += entry.denom50 || 0;
        acc.denom20 += entry.denom20 || 0;
        acc.denom10 += entry.denom10 || 0;
        return acc;
      },
      { denom2000: 0, denom500: 0, denom200: 0, denom100: 0, denom50: 0, denom20: 0, denom10: 0 }
    );

    const denominations = [
      { denom: '₹2000', count: denomTotals.denom2000, amount: denomTotals.denom2000 * 2000 },
      { denom: '₹500', count: denomTotals.denom500, amount: denomTotals.denom500 * 500 },
      { denom: '₹200', count: denomTotals.denom200, amount: denomTotals.denom200 * 200 },
      { denom: '₹100', count: denomTotals.denom100, amount: denomTotals.denom100 * 100 },
      { denom: '₹50', count: denomTotals.denom50, amount: denomTotals.denom50 * 50 },
      { denom: '₹20', count: denomTotals.denom20, amount: denomTotals.denom20 * 20 },
      { denom: '₹10', count: denomTotals.denom10, amount: denomTotals.denom10 * 10 },
    ].filter((d) => d.count > 0);

    setCashDetails(denominations);
    setCashModalTitle(`Total Cash Denomination Details for ${isSummaryTable ? 'All Branches' : 'All Entries'}`);
    setIsCashModalVisible(true);
  };

  const handleExpenseModalClose = () => {
    setIsExpenseModalVisible(false);
    setExpenseDetails([]);
    setSelectedEntryId(null);
    setModalTitle('Expense Details');
  };

  const handleCashModalClose = () => {
    setIsCashModalVisible(false);
    setCashDetails([]);
    setCashModalTitle('Cash Denomination Details');
  };

  const handleReset = () => {
    setBranchFilter(null);
    setDateFilter('Today');
    setCustomDateRange(null);
    setDateFilterType('Created');
    setExpenseFilter(null);
  };

  const handlePrint = () => {
    let printContent;
    if (showSummaryTable) {
      printContent = `
        <html>
          <head>
            <title>Branch Summary Report</title>
            <style>
              @media print {
                @page { size: A4; margin: 20mm; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #000; padding: 4px; text-align: left; font-weight: bold; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .difference-equal { background-color: #52c41a; color: #ffffff; font-weight: bold; }
                .difference-less { background-color: #ff4d4f; color: #ffffff; font-weight: bold; }
                .difference-more { background-color: #fadb14; color: #000000; font-weight: bold; }
                .total-sales { background-color: rgb(220, 248, 198); }
                .total-payments { background-color: #50e0ff; }
              }
            </style>
          </head>
          <body>
            <h1>Branch Summary Report</h1>
            <h3>Period: ${dateFilter}${dateFilter === 'Custom' && customDateRange ? ` (${dayjs(customDateRange[0]).format('D/M/YY')} to ${dayjs(customDateRange[1]).format('D/M/YY')})` : ''}</h3>
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Branch</th>
                  <th>Credit Card</th>
                  <th>UPI</th>
                  <th>Cash</th>
                  <th>Expenses</th>
                  <th class="total-sales">System Sales</th>
                  <th class="total-sales">Total Sales</th>
                  <th class="total-payments">Total Payments</th>
                  <th>Difference</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                ${branchTotals.map((entry, index) => {
                  const diff = entry.totalPayments - entry.totalSales;
                  let diffClass = 'difference-equal';
                  if (diff < 0) diffClass = 'difference-less';
                  else if (diff > 0) diffClass = 'difference-more';
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${entry.branchName || 'N/A'}</td>
                      <td>₹${entry.creditCardPayment}</td>
                      <td>₹${entry.upiPayment}</td>
                      <td>₹${entry.cashPayment}</td>
                      <td>₹${entry.expenses}</td>
                      <td class="total-sales">₹${entry.systemSales}</td>
                      <td class="total-sales">₹${entry.totalSales}</td>
                      <td class="total-payments">₹${entry.totalPayments}</td>
                      <td class="${diffClass}">₹${diff}</td>
                      <td>${entry.createdAt ? dayjs(entry.createdAt).format('D/M/YY') : 'N/A'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
    } else {
      printContent = `
        <html>
          <head>
            <title>Closing Entry List</title>
            <style>
              @media print {
                @page { size: A4; margin: 20mm; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #000; padding: 4px; text-align: left; font-weight: bold; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .difference-equal { background-color: #52c41a; color: #ffffff; font-weight: bold; }
                .difference-less { background-color: #ff4d4f; color: #ffffff; font-weight: bold; }
                .difference-more { background-color: #fadb14; color: #000000; font-weight: bold; }
                .total-sales { background-color: rgb(220, 248, 198); }
                .total-payments { background-color: #50e0ff; }
              }
            </style>
          </head>
          <body>
            <h1>Closing Entry List</h1>
            <h3>Period: ${dateFilter}${dateFilter === 'Custom' && customDateRange ? ` (${dayjs(customDateRange[0]).format('D/M/YY')} to ${dayjs(customDateRange[1]).format('D/M/YY')})` : ''}</h3>
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Branch</th>
                  <th>Credit Card</th>
                  <th>UPI</th>
                  <th>Cash</th>
                  <th>Expenses</th>
                  <th class="total-sales">System Sales</th>
                  <th class="total-sales">Total Sales</th>
                  <th class="total-payments">Total Payments</th>
                  <th>Difference</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                ${filteredEntries.map((entry, index) => {
                  const sales = entry.systemSales + entry.manualSales + entry.onlineSales;
                  const payments = entry.creditCardPayment + entry.upiPayment + entry.cashPayment + entry.expenses;
                  const diff = payments - sales;
                  let diffClass = 'difference-equal';
                  if (diff < 0) diffClass = 'difference-less';
                  else if (diff > 0) diffClass = 'difference-more';
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${entry.branchId?.name || 'N/A'}</td>
                      <td>₹${entry.creditCardPayment}</td>
                      <td>₹${entry.upiPayment}</td>
                      <td>₹${entry.cashPayment}</td>
                      <td>₹${entry.expenses}</td>
                      <td class="total-sales">₹${entry.systemSales}</td>
                      <td class="total-sales">₹${sales}</td>
                      <td class="total-payments">₹${payments}</td>
                      <td class="${diffClass}">₹${diff}</td>
                      <td>${dayjs(entry.createdAt).format('D/M/YY')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const branchTotals = useMemo(() => {
    const totals = {};
    filteredEntries.forEach((entry) => {
      const branchId = entry.branchId?._id || 'unknown';
      const branchName = entry.branchId?.name || 'Unknown Branch';
      if (!totals[branchId]) {
        totals[branchId] = {
          branchId,
          branchName,
          systemSales: 0,
          totalSales: 0,
          totalPayments: 0,
          expenses: 0,
          creditCardPayment: 0,
          upiPayment: 0,
          cashPayment: 0,
          denom2000: 0,
          denom500: 0,
          denom200: 0,
          denom100: 0,
          denom50: 0,
          denom20: 0,
          denom10: 0,
          createdAt: entry.createdAt,
          expenseDetails: [],
        };
      }
      totals[branchId].systemSales += entry.systemSales || 0;
      totals[branchId].totalSales += (entry.systemSales || 0) + (entry.manualSales || 0) + (entry.onlineSales || 0);
      totals[branchId].totalPayments += (entry.creditCardPayment || 0) + (entry.upiPayment || 0) + (entry.cashPayment || 0) + (entry.expenses || 0);
      totals[branchId].expenses += entry.expenses || 0;
      totals[branchId].creditCardPayment += entry.creditCardPayment || 0;
      totals[branchId].upiPayment += entry.upiPayment || 0;
      totals[branchId].cashPayment += entry.cashPayment || 0;
      totals[branchId].denom2000 += entry.denom2000 || 0;
      totals[branchId].denom500 += entry.denom500 || 0;
      totals[branchId].denom200 += entry.denom200 || 0;
      totals[branchId].denom100 += entry.denom100 || 0;
      totals[branchId].denom50 += entry.denom50 || 0;
      totals[branchId].denom20 += entry.denom20 || 0;
      totals[branchId].denom10 += entry.denom10 || 0;
      totals[branchId].expenseDetails.push(...(entry.expenseDetails || []));
      if (!totals[branchId].createdAt || dayjs(entry.createdAt).isAfter(dayjs(totals[branchId].createdAt))) {
        totals[branchId].createdAt = entry.createdAt;
      }
    });
    return Object.values(totals);
  }, [filteredEntries]);

  const lineChartData = useMemo(() => {
    let startDate, endDate;
    const today = dayjs().tz('Asia/Kolkata').startOf('day');
    switch (dateFilter) {
      case 'Today':
        startDate = today;
        endDate = today.endOf('day');
        break;
      case 'Yesterday':
        startDate = today.subtract(1, 'day').startOf('day');
        endDate = today.subtract(1, 'day').endOf('day');
        break;
      case 'Last 7 Days':
        startDate = today.subtract(6, 'day').startOf('day');
        endDate = today.endOf('day');
        break;
      case 'Last 30 Days':
        startDate = today.subtract(29, 'day').startOf('day');
        endDate = today.endOf('day');
        break;
      case 'Custom':
        if (customDateRange && customDateRange.length === 2) {
          startDate = dayjs(customDateRange[0]).tz('Asia/Kolkata').startOf('day');
          endDate = dayjs(customDateRange[1]).tz('Asia/Kolkata').endOf('day');
        }
        break;
      default:
        startDate = today;
        endDate = today.endOf('day');
    }

    if (!startDate || !endDate || !startDate.isValid() || !endDate.isValid()) {
      console.warn('Invalid date range:', { startDate, endDate });
      return { labels: [], datasets: [], maxValue: 1 };
    }

    const daysDiff = endDate.diff(startDate, 'day') + 1;
    const labels = Array.from({ length: daysDiff }, (_, i) =>
      startDate.add(i, 'day').format('D/M/YY')
    );

    const dailySales = Array(daysDiff).fill(0);
    const dailyPayments = Array(daysDiff).fill(0);
    const dailyExpenses = Array(daysDiff).fill(0);

    filteredEntries.forEach((entry) => {
      const entryDate = dayjs(dateFilterType === 'Created' ? entry.createdAt : entry.date).tz('Asia/Kolkata');
      if (!entryDate.isValid()) {
        console.warn('Invalid entry date:', { entryDate, entry });
        return;
      }
      if (entryDate.isBetween(startDate, endDate, null, '[]')) {
        const dayIndex = entryDate.startOf('day').diff(startDate, 'day');
        if (dayIndex >= 0 && dayIndex < daysDiff) {
          const sales = (entry.systemSales || 0) + (entry.manualSales || 0) + (entry.onlineSales || 0);
          const payments = (entry.creditCardPayment || 0) + (entry.upiPayment || 0) + (entry.cashPayment || 0) + (entry.expenses || 0);
          dailySales[dayIndex] += sales;
          dailyPayments[dayIndex] += payments;
          dailyExpenses[dayIndex] += entry.expenses || 0;
        }
      }
    });

    const maxValue = Math.max(...dailySales, ...dailyPayments, ...dailyExpenses, 1);

    return {
      labels,
      datasets: [
        {
          label: 'Total Sales',
          data: dailySales,
          borderColor: '#36A2EB',
          backgroundColor: '#36A2EB',
          fill: false,
          tension: 0.1,
        },
        {
          label: 'Total Payments',
          data: dailyPayments,
          borderColor: '#52C41A',
          backgroundColor: '#52C41A',
          fill: false,
          tension: 0.1,
        },
        {
          label: 'Expenses',
          data: dailyExpenses,
          borderColor: '#FF4D4F',
          backgroundColor: '#FF4D4F',
          fill: false,
          tension: 0.1,
        },
      ],
      maxValue,
    };
  }, [filteredEntries, dateFilter, customDateRange, dateFilterType]);

  const lineChartOptions = {
    layout: {
      padding: { left: 0, right: 0, top: 20, bottom: 0 },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ₹${context.raw || 0}`,
        },
      },
      datalabels: {
        display: true,
        color: '#FF0000',
        formatter: (value) => `₹${value}`,
        align: 'top',
        anchor: 'end',
        offset: 5,
        font: { weight: 'bold', size: 10 },
        textAlign: 'center',
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Date', font: { weight: 'bold' } },
        ticks: { autoSkip: false, padding: 0 },
        grid: { offset: false },
        offset: false,
      },
      y: {
        title: { display: true, text: 'Amount (₹)', font: { weight: 'bold' } },
        beginAtZero: true,
        max: Math.ceil(lineChartData.maxValue * 1.1),
        ticks: { callback: (value) => `₹${value}` },
      },
    },
    maintainAspectRatio: false,
  };

  const customLineChartLegend = lineChartData.datasets.map((dataset, index) => (
    <div key={index} style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
      <span
        style={{
          width: '20px',
          height: '20px',
          backgroundColor: dataset.backgroundColor,
          marginRight: '8px',
          borderRadius: '3px',
        }}
      ></span>
      <Text strong style={{ fontSize: '20px' }}>
        {dataset.label}: ₹{dataset.data.reduce((sum, value) => sum + (value || 0), 0)}
      </Text>
    </div>
  ));

  const barChartData = useMemo(() => {
    const salesByBranch = {};
    const dataSource = showSummaryTable ? branchTotals : filteredEntries;
    dataSource.forEach((entry) => {
      const branchName = showSummaryTable ? entry.branchName : (entry.branchId?.name || 'Unknown Branch');
      const sales = showSummaryTable
        ? entry.totalSales
        : ((entry.systemSales || 0) + (entry.manualSales || 0) + (entry.onlineSales || 0));
      salesByBranch[branchName] = (salesByBranch[branchName] || 0) + sales;
    });

    const labels = Object.keys(salesByBranch);
    const data = Object.values(salesByBranch);
    const maxValue = Math.max(...data, 1);

    return {
      labels,
      datasets: [
        {
          label: 'Total Sales',
          data,
          backgroundColor: '#9966FF',
          borderColor: '#9966FF',
          borderWidth: 1,
        },
      ],
      maxValue,
    };
  }, [filteredEntries, branchTotals, showSummaryTable]);

  const barChartOptions = {
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { weight: 'bold' } },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ₹${context.raw || 0}`,
        },
      },
      datalabels: {
        color: '#FF0000',
        anchor: 'end',
        align: 'top',
        offset: 5,
        formatter: (value) => `₹${value}`,
        font: { weight: 'bold', size: 12 },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Branch', font: { weight: 'bold' } },
        ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 },
      },
      y: {
        title: { display: true, text: 'Total Sales (₹)', font: { weight: 'bold' } },
        beginAtZero: true,
        max: Math.ceil(barChartData.maxValue * 1.1),
        ticks: { callback: (value) => `₹${value}` },
      },
    },
    maintainAspectRatio: false,
    barThickness: 30,
  };

  const pieChartData = useMemo(() => {
    const expenseTotals = {};
    let totalExpenses = 0;

    filteredEntries.forEach((entry) => {
      entry.expenseDetails.forEach((detail) => {
        const reason = expenseCategories.includes(detail.reason) ? detail.reason : 'OTHERS';
        const amount = detail.amount || 0;
        expenseTotals[reason] = (expenseTotals[reason] || 0) + amount;
        totalExpenses += amount;
      });
    });

    const labels = [];
    const data = [];
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7BC225',
    ];

    const allCategories = [...expenseCategories];
    allCategories.forEach((category) => {
      const amount = expenseTotals[category] || 0;
      if (amount > 0) {
        labels.push(category);
        data.push(amount);
      }
    });

    return {
      labels,
      datasets: [{ data, backgroundColor: colors.slice(0, data.length), borderWidth: 1 }],
    };
  }, [filteredEntries]);

  const pieChartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        align: 'start',
        labels: {
          color: '#000',
          font: { weight: 'bold', size: 14 },
          boxWidth: 20,
          padding: 10,
          generateLabels: (chart) => {
            const { data } = chart;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const meta = chart.getDatasetMeta(0);
                const style = meta.controller.getStyle(i);
                const value = data.datasets[0].data[i];
                const total = data.datasets[0].data.reduce((sum, val) => sum + val, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
                return {
                  text: `${label}: ₹${value} (${percentage}%)`,
                  fillStyle: style.backgroundColor,
                  strokeStyle: style.borderColor,
                  lineWidth: style.borderWidth,
                  hidden: !chart.getDataVisibility(i),
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#fff',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
            return [`${label}: ₹${value}`, `(${percentage}%)`];
          },
        },
      },
      datalabels: {
        display: (context) => {
          const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
          const percentage = total > 0 ? (context.dataset.data[context.dataIndex] / total) * 100 : 0;
          return percentage >= 0.5;
        },
        color: '#fff',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 3,
        padding: 6,
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
          return `₹${value} (${percentage}%)`;
        },
        align: (context) => {
          const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
          const percentage = total > 0 ? (context.dataset.data[context.dataIndex] / total) * 100 : 0;
          return percentage >= 1 && percentage <= 3 ? 'end' : 'center';
        },
        anchor: (context) => {
          const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
          const percentage = total > 0 ? (context.dataset.data[context.dataIndex] / total) * 100 : 0;
          return percentage >= 1 && percentage <= 3 ? 'end' : 'center';
        },
        offset: (context) => {
          const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
          const percentage = total > 0 ? (context.dataset.data[context.dataIndex] / total) * 100 : 0;
          return percentage >= 1 && percentage <= 3 ? -10 : 0;
        },
        font: (context) => {
          const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
          const percentage = total > 0 ? (context.dataset.data[context.dataIndex] / total) * 100 : 0;
          let fontSize = percentage < 1 ? 10 : percentage <= 5 ? 14 : 16;
          return { weight: 'bold', size: fontSize };
        },
        textAlign: 'center',
      },
    },
    maintainAspectRatio: false,
  };

  const expenseColumns = [
    { title: 'S.No', key: 'sno', render: (text, record, index) => index + 1, width: 80 },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', render: (value) => <Text strong>{value || 'N/A'}</Text> },
    { title: 'Recipient', dataIndex: 'recipient', key: 'recipient', render: (value) => <Text strong>{value || 'N/A'}</Text> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (value) => <Text strong>₹{value || 0}</Text>, align: 'right' },
  ];

  const cashColumns = [
    { title: 'Denomination', dataIndex: 'denom', key: 'denom', render: (value) => <Text strong>{value}</Text> },
    { title: 'Count', dataIndex: 'count', key: 'count', render: (value) => <Text strong>{value}</Text>, align: 'right' },
    { title: 'Total Amount', dataIndex: 'amount', key: 'amount', render: (value) => <Text strong>₹{value}</Text>, align: 'right' },
  ];

  const summaryColumns = [
    {
      title: 'S.No',
      key: 'sno',
      render: (text, record, index) => <Text strong>{index + 1}</Text>,
      width: 60,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'Branch',
      dataIndex: 'branchName',
      key: 'branch',
      render: (value) => <Text strong>{value || 'N/A'}</Text>,
      width: 120,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'Credit Card',
      dataIndex: 'creditCardPayment',
      key: 'creditCardPayment',
      render: (value) => <Text strong>₹{value}</Text>,
      width: 120,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'UPI',
      dataIndex: 'upiPayment',
      key: 'upiPayment',
      render: (value) => <Text strong>₹{value}</Text>,
      width: 120,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'Cash',
      dataIndex: 'cashPayment',
      key: 'cashPayment',
      render: (value, record, index) => (
        <Text
          strong
          style={{ fontSize: '16px', cursor: value > 0 ? 'pointer' : 'default' }}
          onClick={() => value > 0 && handleViewCash(record, record.branchName, index)}
        >
          ₹{value}
        </Text>
      ),
      width: 120,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'Expenses',
      dataIndex: 'expenses',
      key: 'expenses',
      render: (value, record) => (
        <Text
          strong
          style={{ fontSize: '16px', cursor: value > 0 ? 'pointer' : 'default' }}
          onClick={() => value > 0 && handleViewExpenses(record, record.branchName, null)}
        >
          ₹{value}
        </Text>
      ),
      width: 140,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: (record, rowIndex) => ({
        style: rowIndex === branchTotals.length ? { backgroundColor: '#006400', color: '#ffffff' } : { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'System Sales',
      dataIndex: 'systemSales',
      key: 'systemSales',
      sorter: (a, b) => a.systemSales - b.systemSales,
      render: (value) => <Text strong>₹{value}</Text>,
      width: 120,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'Total Sales',
      dataIndex: 'totalSales',
      key: 'totalSales',
      sorter: (a, b) => a.totalSales - b.totalSales,
      render: (value) => <Text strong>₹{value}</Text>,
      width: 120,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'Total Payments',
      dataIndex: 'totalPayments',
      key: 'totalPayments',
      sorter: (a, b) => a.totalPayments - b.totalPayments,
      render: (value) => <Text strong>₹{value}</Text>,
      width: 120,
      onHeaderCell: () => ({
        style: { backgroundColor: '#50e0ff' },
      }),
      onCell: () => ({
        style: { backgroundColor: '#50e0ff' },
      }),
    },
    {
      title: 'Difference',
      key: 'difference',
      sorter: (a, b) => (a.totalPayments - a.totalSales) - (b.totalPayments - b.totalSales),
      render: (record) => {
        const diff = record.totalPayments - record.totalSales;
        let backgroundColor, textColor;
        if (diff === 0) {
          backgroundColor = '#52c41a';
          textColor = '#ffffff';
        } else if (diff < 0) {
          backgroundColor = '#ff4d4f';
          textColor = '#ffffff';
        } else {
          backgroundColor = '#fadb14';
          textColor = '#000000';
        }
        return (
          <Text strong style={{ color: textColor, padding: '4px 8px', borderRadius: '4px' }}>
            ₹{diff}
          </Text>
        );
      },
      onCell: (record) => {
        const diff = record.totalPayments - record.totalSales;
        let backgroundColor;
        if (diff === 0) {
          backgroundColor = '#52c41a';
        } else if (diff < 0) {
          backgroundColor = '#ff4d4f';
        } else {
          backgroundColor = '#fadb14';
        }
        return {
          style: { backgroundColor },
        };
      },
      onHeaderCell: () => ({
        style: { backgroundColor: '#FCC6C8' },
      }),
      width: 120,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (date) => (
        <Tooltip title={dayjs(date).format('D/M/YY hh:mm A')}>
          <Text strong>{date ? dayjs(date).format('D/M/YY') : 'N/A'}</Text>
        </Tooltip>
      ),
      width: 100,
    },
  ];

  const detailedColumns = [
    {
      title: 'S.No',
      key: 'sno',
      render: (text, record, index) => <Text strong>{index + 1}</Text>,
      width: 60,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'Branch',
      dataIndex: ['branchId', 'name'],
      key: 'branch',
      render: (value) => <Text strong>{value || 'N/A'}</Text>,
      width: 120,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'Credit Card Payment',
      dataIndex: 'creditCardPayment',
      key: 'creditCardPayment',
      render: (value) => <Text strong>₹{value}</Text>,
      width: 120,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'UPI',
      dataIndex: 'upiPayment',
      key: 'upiPayment',
      render: (value) => <Text strong>₹{value}</Text>,
      width: 120,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'Cash',
      dataIndex: 'cashPayment',
      key: 'cashPayment',
      render: (value, record, index) => (
        <Text
          strong
          style={{ fontSize: '16px', cursor: value > 0 ? 'pointer' : 'default' }}
          onClick={() => value > 0 && handleViewCash(record, record.branchId?.name, index)}
        >
          ₹{value}
        </Text>
      ),
      width: 120,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'Expenses',
      dataIndex: 'expenses',
      key: 'expenses',
      render: (value, record) => (
        <Text
          strong
          style={{ fontSize: '16px', cursor: value > 0 ? 'pointer' : 'default' }}
          onClick={() => value > 0 && handleViewExpenses(record, record.branchId?.name, null)}
        >
          ₹{value}
        </Text>
      ),
      width: 140,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: (record, rowIndex) => ({
        style: rowIndex === filteredEntries.length ? { backgroundColor: '#006400', color: '#ffffff' } : { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'System Sales',
      dataIndex: 'systemSales',
      key: 'systemSales',
      sorter: (a, b) => a.systemSales - b.systemSales,
      render: (value) => <Text strong>₹{value}</Text>,
      width: 120,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'Total Sales',
      key: 'totalSales',
      sorter: (a, b) => (a.systemSales + a.manualSales + a.onlineSales) - (b.systemSales + b.manualSales + b.onlineSales),
      render: (record) => <Text strong>₹{(record.systemSales || 0) + (record.manualSales || 0) + (record.onlineSales || 0)}</Text>,
      width: 120,
      onHeaderCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 198)' },
      }),
    },
    {
      title: 'Total Payments',
      key: 'totalPayments',
      sorter: (a, b) => (a.creditCardPayment + a.upiPayment + a.cashPayment + a.expenses) - (b.creditCardPayment + b.upiPayment + b.cashPayment + b.expenses),
      render: (record) => <Text strong>₹{record.creditCardPayment + record.upiPayment + record.cashPayment + record.expenses}</Text>,
      width: 120,
      onHeaderCell: () => ({
        style: { backgroundColor: '#50e0ff' },
      }),
      onCell: () => ({
        style: { backgroundColor: '#50e0ff' },
      }),
    },
    {
      title: 'Difference',
      key: 'difference',
      render: (record) => {
        const sales = record.systemSales + record.manualSales + record.onlineSales;
        const payments = record.creditCardPayment + record.upiPayment + record.cashPayment + record.expenses;
        const diff = payments - sales;
        let backgroundColor, textColor;
        if (diff === 0) {
          backgroundColor = '#52c41a';
          textColor = '#ffffff';
        } else if (diff < 0) {
          backgroundColor = '#ff4d4f';
          textColor = '#ffffff';
        } else {
          backgroundColor = '#fadb14';
          textColor = '#000000';
        }
        return (
          <Text strong style={{ color: textColor, padding: '4px 8px', borderRadius: '4px' }}>
            ₹{diff}
          </Text>
        );
      },
      onCell: (record) => {
        const sales = record.systemSales + record.manualSales + record.onlineSales;
        const payments = record.creditCardPayment + record.upiPayment + record.cashPayment + record.expenses;
        const diff = payments - sales;
        let backgroundColor;
        if (diff === 0) {
          backgroundColor = '#52c41a';
        } else if (diff < 0) {
          backgroundColor = '#ff4d4f';
        } else {
          backgroundColor = '#fadb14';
        }
        return {
          style: { backgroundColor },
        };
      },
      onHeaderCell: () => ({
        style: { backgroundColor: '#FCC6C8' },
      }),
      width: 120,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (date) => (
        <Tooltip title={dayjs(date).format('D/M/YY hh:mm A')}>
          <Text strong>{date ? dayjs(date).format('D/M/YY') : 'N/A'}</Text>
        </Tooltip>
      ),
      width: 100,
    },
  ];

  return (
    <div
      style={{
        padding: '40px 20px',
        background: 'linear-gradient(to bottom, #f0f2f5, #e6e9f0)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <style>
        {`
          @media print {
            body { margin: 0; padding: 0; background: #fff; }
            .ant-card, .graphs-section { display: none; }
            .ant-table { font-size: 10px; }
            .ant-table th, .ant-table td { padding: 4px !important; font-weight: bold; line-height: 1 !important; }
            @page { size: A4; margin: 10mm; }
            .total-sales { background-color: rgb(220, 248, 198); }
            .total-payments { background-color: #50e0ff; }
          }
          .filter-header {
            background: #fff;
            margin-bottom: 20px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            border-radius: 12px;
          }
          .graphs-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            gap: 20px;
          }
          .upper-graphs {
            display: flex;
            flex-direction: row;
            justifyContent: flex-start;
            width: 100%;
            max-width: 1600px;
            gap: 20px;
          }
          .lower-graphs {
            display: flex;
            flex-direction: row;
            justifyContent: center;
            width: 100%;
            max-width: 1600px;
            gap: 20px;
          }
          .chart-container.line {
            width: 100%;
            max-width: 1600px;
            height: 50vh;
            min-height: 400px;
            min-width: 900px;
          }
          .chart-container.bar {
            width: 50%;
            max-width: 800px;
            height: 50vh;
            min-height: 400px;
            min-width: 400px;
          }
          .chart-container.pie {
            display: flex;
            justifyContent: center;
            alignItems: center;
            width: 50%;
            max-width: 800px;
            height: 60vh;
            min-height: 450px;
            min-width: 450px;
          }
          .pie-card, .line-card, .bar-card {
            width: 100%;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            background: #fff;
            padding: 20px;
            display: flex;
            justifyContent: flex-start;
            alignItems: center;
          }
          .pie-card, .bar-card {
            max-width: 800px;
            justifyContent: center;
          }
          .line-card {
            max-width: 1600px;
          }
          .chart-legend-bottom-left {
            display: flex;
            flex-direction: column;
            alignItems: flex-start;
            padding: 10px 0;
          }
          .chart-legend-bottom-left .legend-item {
            display: flex;
            alignItems: center;
            margin-bottom: 8px;
          }
          .chart-legend-bottom-left .legend-item span {
            margin-right: 8px;
          }
          .ant-table td, .ant-table th {
            padding: 4px !important;
            line-height: 1 !important;
          }
          @media (max-width: 1200px) {
            .upper-graphs { flex-direction: column; alignItems: flex-start; }
            .lower-graphs { flex-direction: column; alignItems: center; }
            .chart-container.line { width: 95vw; max-width: 1200px; min-width: 700px; height: 45vh; min-height: 350px; }
            .chart-container.bar { width: 95vw; max-width: 600px; min-width: 500px; height: 45vh; min-height: 350px; }
            .chart-container.pie { width: 95vw; max-width: 600px; min-width: 500px; height: 55vh; min-height: 400px; }
            .line-card, .bar-card, .pie-card { max-width: 100%; }
          }
          @media (max-width: 768px) {
            .chart-container.line { width: 98vw; max-width: 1000px; min-width: 400px; height: 40vh; min-height: 300px; }
            .chart-container.bar { width: 98vw; max-width: 500px; min-width: 400px; height: 40vh; min-height: 300px; }
            .chart-container.pie { width: 98vw; max-width: 500px; min-width: 400px; height: 50vh; min-height: 350px; }
          }
          @media (max-width: 480px) {
            .chart-container.line { width: 98vw; max-width: 850px; min-width: 300px; height: 35vh; min-height: 250px; }
            .chart-container.bar { width: 98vw; max-width: 400px; min-width: 300px; height: 35vh; min-height: 250px; }
            .chart-container.pie { width: 98vw; max-width: 400px; min-width: 350px; height: 45vh; min-height: 300px; }
          }
          @media (max-width: 768px) {
            .custom-legend { flex-direction: column; alignItems: flex-start; }
            .custom-legend > div { margin-bottom: 10px; margin-right: 0; }
          }
        `}
      </style>
      <div style={{ maxWidth: '1600px', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Card
              className="filter-header"
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                marginBottom: '20px',
              }}
            >
              <Space wrap style={{ width: '100%', padding: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Branch</Text>
                  <Select
                    placeholder="All Branches"
                    value={branchFilter}
                    onChange={(value) => setBranchFilter(value)}
                    allowClear
                    style={{ width: '200px' }}
                  >
                    {branches.map((branch) => (
                      <Option key={branch._id} value={branch._id}>
                        {branch.name}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Date Filter</Text>
                  <Space>
                    <Select
                      value={dateFilter}
                      onChange={(value) => {
                        setDateFilter(value);
                        if (value !== 'Custom') setCustomDateRange(null);
                      }}
                      style={{ width: '150px' }}
                    >
                      <Option value="Today">Today</Option>
                      <Option value="Yesterday">Yesterday</Option>
                      <Option value="Last 7 Days">Last 7 Days</Option>
                      <Option value="Last 30 Days">Last 30 Days</Option>
                      <Option value="Custom">Custom</Option>
                    </Select>
                    <RangePicker
                      value={customDateRange}
                      onChange={(dates) => setCustomDateRange(dates)}
                      format="D/M/YY"
                      style={{ width: '250px' }}
                      disabled={dateFilter !== 'Custom'}
                    />
                  </Space>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Expense Reason</Text>
                  <Select
                    placeholder="All Expenses"
                    value={expenseFilter}
                    onChange={(value) => setExpenseFilter(value)}
                    allowClear
                    style={{ width: '200px' }}
                  >
                    <Option value={null}>All Expenses</Option>
                    {expenseCategories.map((category) => (
                      <Option key={category} value={category}>
                        {category.charAt(0) + category.slice(1).toLowerCase()}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Table View</Text>
                  <Switch
                    checked={showSummaryTable}
                    onChange={(checked) => setShowSummaryTable(checked)}
                    checkedChildren="Summary"
                    unCheckedChildren="Detailed"
                  />
                </div>

                <Space style={{ marginTop: '20px' }}>
                  <Button icon={<PrinterOutlined />} onClick={handlePrint} />
                  <Button type="default" icon={<RedoOutlined />} onClick={handleReset}>
                    Reset
                  </Button>
                </Space>
              </Space>
            </Card>

            <Card
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                background: '#fff',
                marginBottom: '20px',
              }}
            >
              <Table
                columns={showSummaryTable ? summaryColumns : detailedColumns}
                dataSource={showSummaryTable ? branchTotals : filteredEntries}
                rowKey={showSummaryTable ? 'branchId' : '_id'}
                pagination={{ pageSize: 10 }}
                bordered
                summary={(data) => {
                  if (!data.length) return null;
                  const totals = data.reduce(
                    (acc, record) => {
                      if (showSummaryTable) {
                        acc.creditCardPayment += record.creditCardPayment || 0;
                        acc.upiPayment += record.upiPayment || 0;
                        acc.cashPayment += record.cashPayment || 0;
                        acc.expenses += record.expenses || 0;
                        acc.systemSales += record.systemSales || 0;
                        acc.totalSales += record.totalSales || 0;
                        acc.totalPayments += record.totalPayments || 0;
                        acc.difference += (record.totalPayments || 0) - (record.totalSales || 0);
                        acc.expenseDetails.push(...(record.expenseDetails || []));
                        acc.denom2000 += record.denom2000 || 0;
                        acc.denom500 += record.denom500 || 0;
                        acc.denom200 += record.denom200 || 0;
                        acc.denom100 += record.denom100 || 0;
                        acc.denom50 += record.denom50 || 0;
                        acc.denom20 += record.denom20 || 0;
                        acc.denom10 += record.denom10 || 0;
                      } else {
                        acc.creditCardPayment += record.creditCardPayment || 0;
                        acc.upiPayment += record.upiPayment || 0;
                        acc.cashPayment += record.cashPayment || 0;
                        acc.expenses += record.expenses || 0;
                        acc.systemSales += record.systemSales || 0;
                        acc.totalSales += (record.systemSales || 0) + (record.manualSales || 0) + (record.onlineSales || 0);
                        acc.totalPayments += (record.creditCardPayment || 0) + (record.upiPayment || 0) + (record.cashPayment || 0) + (record.expenses || 0);
                        acc.difference += ((record.creditCardPayment || 0) + (record.upiPayment || 0) + (record.cashPayment || 0) + (record.expenses || 0)) - ((record.systemSales || 0) + (record.manualSales || 0) + (record.onlineSales || 0));
                        acc.expenseDetails.push(...(record.expenseDetails || []));
                        acc.denom2000 += record.denom2000 || 0;
                        acc.denom500 += record.denom500 || 0;
                        acc.denom200 += record.denom200 || 0;
                        acc.denom100 += record.denom100 || 0;
                        acc.denom50 += record.denom50 || 0;
                        acc.denom20 += record.denom20 || 0;
                        acc.denom10 += record.denom10 || 0;
                      }
                      return acc;
                    },
                    {
                      creditCardPayment: 0,
                      upiPayment: 0,
                      cashPayment: 0,
                      expenses: 0,
                      systemSales: 0,
                      totalSales: 0,
                      totalPayments: 0,
                      difference: 0,
                      expenseDetails: [],
                      denom2000: 0,
                      denom500: 0,
                      denom200: 0,
                      denom100: 0,
                      denom50: 0,
                      denom20: 0,
                      denom10: 0,
                    }
                  );

                  const formatNumber = (value) => {
                    if (Number.isInteger(value)) {
                      return value.toString();
                    }
                    return value.toFixed(2);
                  };

                  return (
                    <Table.Summary.Row style={{ backgroundColor: '#2c3e50', color: '#ffffff' }}>
                      <Table.Summary.Cell index={0}>
                        <Text strong style={{ fontSize: '12px', color: '#ffffff' }}>Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} />
                      <Table.Summary.Cell index={showSummaryTable ? 2 : 2}>
                        <Text strong style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                          ₹{formatNumber(totals.creditCardPayment)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={showSummaryTable ? 3 : 3}>
                        <Text strong style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                          ₹{formatNumber(totals.upiPayment)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={showSummaryTable ? 4 : 4}>
                        <Text
                          strong
                          style={{ fontSize: '18px', fontWeight: '700', cursor: totals.cashPayment > 0 ? 'pointer' : 'default', color: '#ffffff' }}
                          onClick={() => totals.cashPayment > 0 && handleViewTotalCash(totals, showSummaryTable)}
                        >
                          ₹{formatNumber(totals.cashPayment)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={showSummaryTable ? 5 : 5}>
                        <Text
                          strong
                          style={{ fontSize: '18px', fontWeight: '700', cursor: totals.expenses > 0 ? 'pointer' : 'default', color: '#ffffff' }}
                          onClick={() =>
                            totals.expenses > 0 &&
                            handleViewExpenses(
                              { expenseDetails: totals.expenseDetails, _id: 'total' },
                              showSummaryTable ? 'All Branches' : 'All Entries',
                              null
                            )
                          }
                        >
                          ₹{formatNumber(totals.expenses)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={showSummaryTable ? 6 : 6}>
                        <Text strong style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                          ₹{formatNumber(totals.systemSales)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={showSummaryTable ? 7 : 7}>
                        <Text strong style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                          ₹{formatNumber(totals.totalSales)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={showSummaryTable ? 8 : 8}>
                        <Text strong style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                          ₹{formatNumber(totals.totalPayments)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={showSummaryTable ? 9 : 9}>
                        <Text
                          strong
                          style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#ffffff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          ₹{formatNumber(totals.difference)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={showSummaryTable ? 10 : 10} />
                    </Table.Summary.Row>
                  );
                }}
              />
            </Card>

            {filteredEntries.length > 0 ? (
              <div className="graphs-section">
                <Card className="line-card">
                  <div style={{ textAlign: 'left' }}>
                    <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '10px' }}>
                      Daily Trends ({dateFilter})
                    </Text>
                    <div className="custom-legend" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
                      {customLineChartLegend}
                    </div>
                    <div className="chart-container line">
                      <Line data={lineChartData} options={lineChartOptions} />
                    </div>
                  </div>
                </Card>
                <div className="lower-graphs">
                  <Card className="pie-card">
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '10px' }}>
                        Expense Breakdown
                      </Text>
                      <div className="chart-container pie">
                        <Pie data={pieChartData} options={pieChartOptions} />
                      </div>
                    </div>
                  </Card>
                  <Card className="bar-card">
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '10px' }}>
                        Top Sales by Branch
                      </Text>
                      <div className="chart-container bar">
                        <Bar data={barChartData} options={barChartOptions} />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <Card
                className="graphs-section"
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  background: '#fff',
                  marginBottom: '20px',
                }}
              >
                <Text style={{ display: 'block', textAlign: 'center', padding: '20px' }}>
                  No data to display
                </Text>
              </Card>
            )}

            <Modal
              title={modalTitle}
              open={isExpenseModalVisible}
              onCancel={handleExpenseModalClose}
              footer={null}
              width={600}
            >
              {expenseDetails.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text>No expense details available.</Text>
                </div>
              ) : (
                <Table
                  columns={expenseColumns}
                  dataSource={expenseDetails}
                  rowKey={(record, index) => index}
                  pagination={false}
                  bordered
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3} align="right">
                        <Text strong>Total Amount</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <Text strong>
                          ₹{expenseDetails.reduce((sum, item) => sum + (item.amount || 0), 0)}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              )}
            </Modal>

            <Modal
              title={cashModalTitle}
              open={isCashModalVisible}
              onCancel={handleCashModalClose}
              footer={null}
              width={600}
            >
              {cashDetails.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text>No cash denomination details available.</Text>
                </div>
              ) : (
                <Table
                  columns={cashColumns}
                  dataSource={cashDetails}
                  rowKey={(record) => record.denom}
                  pagination={false}
                  bordered
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2} align="right">
                        <Text strong>Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <Text strong>
                          ₹{cashDetails.reduce((sum, item) => sum + (item.amount || 0), 0)}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              )}
            </Modal>
          </>
        )}
      </div>
    </div>
  );
};

export default ClosingEntryList;
