
import React, { useState, useEffect, useMemo } from 'react';
import { Table, Select, DatePicker, Button, Input, Typography, Space, Card, Spin, Switch, Modal } from 'antd';
import { RedoOutlined, PrinterOutlined } from '@ant-design/icons';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { Text } = Typography;

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

ChartJS.register(ArcElement, ChartTooltip, Legend, BarElement, CategoryScale, LinearScale, ChartDataLabels);

const ExpenseEntry = () => {
  const [closingEntries, setClosingEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [branchFilter, setBranchFilter] = useState(null);
  const [dateRangeFilter, setDateRangeFilter] = useState([dayjs(), dayjs()]);
  const [dateFilterType, setDateFilterType] = useState('today');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [showSummaryTable, setShowSummaryTable] = useState(true);
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [expenseDetails, setExpenseDetails] = useState([]);
  const [modalTitle, setModalTitle] = useState('Expense Details');
  const [selectedEntryId, setSelectedEntryId] = useState(null);

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
    fetchBranches();
    fetchClosingEntries();
  }, []);

  useEffect(() => {
    let filtered = [...closingEntries];

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter((entry) => {
        const branchMatch = entry.branchId?.name?.toLowerCase().includes(searchLower);
        const expenseMatch = entry.expenseDetails.some((detail) => {
          const recipientMatch = detail.recipient?.toLowerCase().includes(searchLower);
          const amountMatch = detail.amount?.toString().includes(searchLower);
          const reasonMatch = detail.reason?.toLowerCase().includes(searchLower);
          return recipientMatch || amountMatch || reasonMatch;
        });
        return branchMatch || expenseMatch;
      });
    }

    if (branchFilter) {
      filtered = filtered.filter((entry) => entry.branchId?._id === branchFilter);
    }

    if (dateRangeFilter && dateRangeFilter.length === 2) {
      const startDate = dayjs(dateRangeFilter[0]).startOf('day');
      const endDate = dayjs(dateRangeFilter[1]).endOf('day');
      filtered = filtered.filter((entry) => {
        const entryDate = dayjs(entry.date);
        return entryDate.isValid() && entryDate.isBetween(startDate, endDate, null, '[]');
      });
    }

    if (categoryFilter) {
      filtered = filtered.filter((entry) =>
        entry.expenseDetails.some((detail) => detail.reason === categoryFilter)
      );
    }

    setFilteredEntries(filtered);
  }, [closingEntries, searchText, branchFilter, dateRangeFilter, categoryFilter]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/branches/public', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        setBranches(result);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchClosingEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/closing-entries', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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

  const handleReset = () => {
    setSearchText('');
    setBranchFilter(null);
    setDateRangeFilter([dayjs(), dayjs()]);
    setDateFilterType('today');
    setCategoryFilter(null);
    setShowSummaryTable(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDateFilterChange = (value) => {
    setDateFilterType(value);
    const today = dayjs();
    switch (value) {
      case 'today':
        setDateRangeFilter([today, today]);
        break;
      case 'yesterday':
        setDateRangeFilter([today.subtract(1, 'day'), today.subtract(1, 'day')]);
        break;
      case 'last7days':
        setDateRangeFilter([today.subtract(6, 'day'), today]);
        break;
      case 'last30days':
        setDateRangeFilter([today.subtract(29, 'day'), today]);
        break;
      case 'custom':
        setDateRangeFilter(null);
        break;
      default:
        break;
    }
  };

  const handleViewExpenses = (record, branchName, date, category = null) => {
    let expenses = record.expenseDetails || [];
    if (category) {
      expenses = expenses.filter((detail) =>
        category === 'OTHERS'
          ? !expenseCategories.includes(detail.reason) || detail.reason === 'OTHERS'
          : detail.reason === category
      );
    }
    setSelectedEntryId(record._id || 'total');
    setExpenseDetails(expenses);
    const formattedDate = date ? dayjs(date).format('DD-MM-YYYY') : '';
    const categoryLabel = category
      ? ` - ${category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}`
      : '';
    setModalTitle(`Expense Details for ${branchName || 'Unknown Branch'} ${formattedDate ? `on ${formattedDate}` : ''}${categoryLabel}`);
    setIsExpenseModalVisible(true);
  };

  const handleExpenseModalClose = () => {
    setIsExpenseModalVisible(false);
    setExpenseDetails([]);
    setSelectedEntryId(null);
    setModalTitle('Expense Details');
  };

  const branchTotals = useMemo(() => {
    const totals = {};
    filteredEntries.forEach((entry) => {
      const branchId = entry.branchId?._id || 'unknown';
      const branchName = entry.branchId?.name || 'Unknown Branch';
      if (!totals[branchId]) {
        totals[branchId] = {
          branchId: { _id: branchId, name: branchName },
          expenses: 0,
          expenseDetails: [],
          categoryTotals: expenseCategories.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {}),
          createdAt: entry.createdAt,
        };
      }
      totals[branchId].expenses += entry.expenses || 0;
      totals[branchId].expenseDetails.push(...(entry.expenseDetails || []));
      entry.expenseDetails.forEach((detail) => {
        const reason = expenseCategories.includes(detail.reason) ? detail.reason : 'OTHERS';
        totals[branchId].categoryTotals[reason] += detail.amount || 0;
      });
      if (dayjs(entry.createdAt).isAfter(dayjs(totals[branchId].createdAt))) {
        totals[branchId].createdAt = entry.createdAt;
      }
    });
    return Object.values(totals).sort((a, b) => b.expenses - a.expenses);
  }, [filteredEntries]);

  const formatNumber = (value) => {
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(2);
  };

  const expenseColumns = [
    { title: 'S.No', key: 'sno', render: (text, record, index) => index + 1, width: 80 },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', render: (value) => <Text strong>{value || 'N/A'}</Text> },
    { title: 'Recipient', dataIndex: 'recipient', key: 'recipient', render: (value) => <Text strong>{value || 'N/A'}</Text> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (value) => <Text strong>₹{formatNumber(value || 0)}</Text>, align: 'right' },
  ];

  const summaryColumns = [
    {
      title: 'S.No',
      key: 'sno',
      render: (text, record, index) => index + 1,
      width: 40,
    },
    {
      title: 'Branch',
      dataIndex: ['branchId', 'name'],
      key: 'branch',
      render: (value) => value || 'N/A',
      width: 80,
      onCell: () => ({
        style: { backgroundColor: 'lightskyblue' },
      }),
    },
    {
      title: 'Total Expense',
      dataIndex: 'expenses',
      key: 'totalExpense',
      render: (value, record) => (
        <Text
          strong
          style={{ cursor: value > 0 ? 'pointer' : 'default' }}
          onClick={() => value > 0 && handleViewExpenses(record, record.branchId?.name || 'Unknown Branch', null, null)}
        >
          ₹{formatNumber(value || 0)}
        </Text>
      ),
      width: 80,
      onCell: (record, rowIndex) => ({
        style: rowIndex === branchTotals.length ? { backgroundColor: '#006400', color: '#ffffff' } : { backgroundColor: '#ff6384' },
      }),
    },
    ...expenseCategories.map((category) => ({
      title: category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
      key: category.toLowerCase(),
      render: (record) => {
        const amount = record.categoryTotals[category] || 0;
        return amount > 0 ? (
          <Text
            strong
            style={{ cursor: 'pointer' }}
            onClick={() => handleViewExpenses(record, record.branchId?.name || 'Unknown Branch', null, category)}
          >
            ₹{formatNumber(amount)}
          </Text>
        ) : (
          '-'
        );
      },
      width: 80,
      onCell: (record) => ({
        style: { backgroundColor: 'rgb(220, 248, 199)' },
        title: record.createdAt ? `Created At: ${dayjs(record.createdAt).format('DD/MM/YYYY HH:mm:ss')}` : 'N/A',
      }),
    })),
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => <Text>{value ? dayjs(value).format('D/M/YY') : 'N/A'}</Text>,
      width: 80,
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 199)' },
      }),
    },
  ];

  const detailedColumns = [
    {
      title: 'S.No',
      key: 'sno',
      render: (text, record, index) => index + 1,
      width: 40,
    },
    {
      title: 'Branch',
      dataIndex: ['branchId', 'name'],
      key: 'branch',
      render: (value) => value || 'N/A',
      width: 80,
      onCell: () => ({
        style: { backgroundColor: 'lightskyblue' },
      }),
    },
    {
      title: 'Total Expense',
      dataIndex: 'expenses',
      key: 'totalExpense',
      render: (value, record) => (
        <Text
          strong
          style={{ cursor: value > 0 ? 'pointer' : 'default' }}
          onClick={() => value > 0 && handleViewExpenses(record, record.branchId?.name || 'Unknown Branch', record.date, null)}
        >
          ₹{formatNumber(value || 0)}
        </Text>
      ),
      width: 80,
      onCell: (record, rowIndex) => ({
        style: rowIndex === filteredEntries.length ? { backgroundColor: '#006400', color: '#ffffff' } : { backgroundColor: '#ff6384' },
      }),
    },
    ...expenseCategories.map((category) => ({
      title: category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
      key: category.toLowerCase(),
      render: (record) => {
        const expenses = record.expenseDetails.filter(
          (d) => (category === 'OTHERS' ? !expenseCategories.includes(d.reason) || d.reason === 'OTHERS' : d.reason === category)
        );
        return expenses.length > 0 ? (
          expenses.map((exp, index) => (
            <div key={index}>
              <Text
                strong
                style={{ cursor: 'pointer' }}
                onClick={() => handleViewExpenses(record, record.branchId?.name || 'Unknown Branch', record.date, category)}
              >
                ₹{formatNumber(exp.amount || 0)}
              </Text>
            </div>
          ))
        ) : (
          '-'
        );
      },
      width: 80,
      onCell: (record) => ({
        style: { backgroundColor: 'rgb(220, 248, 199)' },
        title: record.createdAt ? `Created At: ${dayjs(record.createdAt).format('DD/MM/YYYY HH:mm:ss')}` : 'N/A',
      }),
    })),
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => <Text>{value ? dayjs(value).format('D/M/YY') : 'N/A'}</Text>,
      width: 80,
      onCell: () => ({
        style: { backgroundColor: 'rgb(220, 248, 199)' },
      }),
    },
  ];

  const branchChartData = useMemo(() => {
    const branchTotals = {};
    filteredEntries.forEach((entry) => {
      const branchName = entry.branchId?.name || 'Unknown Branch';
      const expense = entry.expenses || 0;
      branchTotals[branchName] = (branchTotals[branchName] || 0) + expense;
    });

    const labels = [];
    const data = [];
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7BC225', '#FF5733'];

    Object.entries(branchTotals).forEach(([branchName, amount]) => {
      if (amount > 0) {
        labels.push(branchName);
        data.push(amount);
      }
    });

    return {
      labels,
      datasets: [{ data, backgroundColor: colors.slice(0, data.length), borderWidth: 1 }],
    };
  }, [filteredEntries]);

  const categoryChartData = useMemo(() => {
    const categoryTotals = {};
    filteredEntries.forEach((entry) => {
      entry.expenseDetails.forEach((detail) => {
        const reason = expenseCategories.includes(detail.reason) ? detail.reason : 'OTHERS';
        const amount = detail.amount || 0;
        categoryTotals[reason] = (categoryTotals[reason] || 0) + amount;
      });
    });

    const labels = [];
    const data = [];
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7BC225', '#FF5733'];

    expenseCategories.forEach((category) => {
      const amount = categoryTotals[category] || 0;
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

  const chartOptions = {
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
                  text: `${label}: ₹${formatNumber(value)} (${percentage}%)`,
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
            return [`${label}: ₹${formatNumber(value)}`, `(${percentage}%)`];
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
          return `₹${formatNumber(value)} (${percentage}%)`;
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

  const branchChartOptions = { ...chartOptions };
  const categoryChartOptions = { ...chartOptions };

  const barChartData = useMemo(() => {
    const currentDate = dayjs();
    const targetMonth = currentDate.month();
    const targetYear = currentDate.year();
    const daysInMonth = currentDate.daysInMonth();

    const labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
    const dailyExpenses = Array(daysInMonth).fill(0);
    const dailyCategoryExpenses = Array(daysInMonth).fill().map(() => ({}));

    filteredEntries.forEach((entry) => {
      const date = dayjs(entry.date);
      if (date.month() === targetMonth && date.year() === targetYear) {
        const dayIndex = date.date() - 1;
        dailyExpenses[dayIndex] += entry.expenses || 0;
        entry.expenseDetails.forEach((detail) => {
          const reason = expenseCategories.includes(detail.reason) ? detail.reason : 'OTHERS';
          dailyCategoryExpenses[dayIndex][reason] += detail.amount || 0;
        });
      }
    });

    const maxExpense = Math.max(...dailyExpenses, 1);

    return {
      labels,
      datasets: [{
        label: 'Daily Expenses',
        data: dailyExpenses,
        backgroundColor: '#36A2EB',
        borderColor: '#36A2EB',
        borderWidth: 1,
      }],
      maxExpense,
      dailyCategoryExpenses,
    };
  }, [filteredEntries]);

  const barChartOptions = {
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { weight: 'bold' } },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const dayIndex = context.dataIndex;
            const totalAmount = context.raw || 0;
            const categories = barChartData.dailyCategoryExpenses[dayIndex];
            const tooltipLines = [`Total: ₹${formatNumber(totalAmount)}`];
            expenseCategories.forEach((category) => {
              const amount = categories[category] || 0;
              if (amount > 0) {
                tooltipLines.push(`${category}: ₹${formatNumber(amount)}`);
              }
            });
            return tooltipLines;
          },
        },
      },
      datalabels: {
        display: true,
        color: '#FFFFFF',
        backgroundColor: '#000000',
        borderRadius: 3,
        padding: 4,
        formatter: (value) => (value > 0 ? `₹${formatNumber(value)}` : ''),
        anchor: 'end',
        align: 'top',
        font: { weight: 'bold', size: 12 },
        textAlign: 'center',
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Date', font: { weight: 'bold' } },
        ticks: { autoSkip: false },
      },
      y: {
        title: { display: true, text: 'Amount (₹)', font: { weight: 'bold' } },
        beginAtZero: true,
        max: Math.ceil(barChartData.maxExpense * 1.1),
        ticks: { callback: (value) => `₹${formatNumber(value)}` },
      },
    },
    maintainAspectRatio: false,
  };

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
      body * { visibility: hidden; }
      .table-section, .table-section * { visibility: visible; }
      .table-section { 
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        box-shadow: none;
        border: none;
      }
      .ant-table { font-size: 10px; }
      .ant-table th, .ant-table td { padding: 2px !important; }
      @page { size: A4; margin: 10mm; }
    }
    .charts-section {
      display: flex; flex-direction: column; width: 100%; max-width: 1600px;
      gap: 20px; margin-bottom: 40px;
    }
    .doughnut-row {
      display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; width: 100%;
    }
    .chart-container.doughnut {
      flex: 1; min-width: 400px; max-width: 600px; height: 60vh; min-height: 400px;
    }
    .doughnut-card {
      width: 100%; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      background: #fff; padding: 20px; display: flex; justify-content: center; align-items: center;
    }
    .chart-container.bar {
      width: 100%; max-width: 1600px; height: 50vh; min-height: 400px;
    }
    .bar-card {
      width: 100%; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      background: #fff; padding: 20px; display: flex; justify-content: center; align-items: center;
    }
    .ant-table td, .ant-table th {
      padding: 2px !important;
      line-height: 1 !important;
    }
    @media (max-width: 1200px) {
      .chart-container.doughnut { min-width: 350px; max-width: 500px; height: 50vh; min-height: 350px; }
      .chart-container.bar { max-width: 1200px; height: 45vh; min-height: 350px; }
    }
    @media (max-width: 768px) {
      .chart-container.doughnut { min-width: 300px; max-width: 450px; height: 45vh; min-height: 300px; }
      .chart-container.bar { max-width: 1000px; height: 40vh; min-height: 300px; }
    }
    @media (max-width: 480px) {
      .chart-container.doughnut { min-width: 250px; max-width: 400px; height: 40vh; min-height: 250px; }
      .chart-container.bar { max-width: 850px; height: 35vh; min-height: 250px; }
    }
    @media print {
      .chart-container.doughnut { display: none; }
      .chart-container.bar { display: none; }
    }
  `}
</style>
      <div style={{ maxWidth: '1600px', width: '100%' }}>
        <Card
          className="filter-section"
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            background: '#fafafa',
            marginBottom: '20px',
            border: '1px solid #e8e8e8',
          }}
        >
          <Space
            direction="horizontal"
            wrap
            style={{
              width: '100%',
              padding: '15px',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Space wrap>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Text strong style={{ marginBottom: '5px' }}>Search</Text>
                <Search
                  placeholder="Search by branch, recipient, amount, or reason"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 300 }}
                  allowClear
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Text strong style={{ marginBottom: '5px' }}>Date</Text>
                <Space>
                  <Select
                    value={dateFilterType}
                    onChange={handleDateFilterChange}
                    style={{ width: 150 }}
                  >
                    <Option value="today">Today</Option>
                    <Option value="yesterday">Yesterday</Option>
                    <Option value="last7days">Last 7 Days</Option>
                    <Option value="last30days">Last 30 Days</Option>
                    <Option value="custom">Custom Date</Option>
                  </Select>
                  {dateFilterType === 'custom' && (
                    <RangePicker
                      value={dateRangeFilter}
                      onChange={(dates) => setDateRangeFilter(dates)}
                      format="YYYY-MM-DD"
                      style={{ width: 200 }}
                    />
                  )}
                </Space>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Text strong style={{ marginBottom: '5px' }}>Branch</Text>
                <Select
                  placeholder="All Branches"
                  value={branchFilter}
                  onChange={(value) => setBranchFilter(value)}
                  allowClear
                  style={{ width: 200 }}
                >
                  <Option value={null}>All Branches</Option>
                  {branches.map((branch) => (
                    <Option key={branch._id} value={branch._id}>{branch.name}</Option>
                  ))}
                </Select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Text strong style={{ marginBottom: '5px' }}>Expense Category</Text>
                <Select
                  placeholder="All Categories"
                  value={categoryFilter}
                  onChange={(value) => setCategoryFilter(value)}
                  allowClear
                  style={{ width: 200 }}
                >
                  <Option value={null}>All Categories</Option>
                  {expenseCategories.map((category) => (
                    <Option key={category} value={category}>
                      {category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Option>
                  ))}
                </Select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Text strong style={{ marginBottom: '5px' }}>View</Text>
                <Switch
                  checked={showSummaryTable}
                  onChange={(checked) => setShowSummaryTable(checked)}
                  checkedChildren="Summary"
                  unCheckedChildren="Detailed"
                  style={{ backgroundColor: showSummaryTable ? '#1890ff' : '#d3d3d3' }}
                />
              </div>
            </Space>
            <Space>
              <Button type="default" icon={<RedoOutlined />} onClick={handleReset}>Reset</Button>
              <Button type="default" icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
            </Space>
          </Space>
        </Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Card
              className="table-section"
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
                rowKey={showSummaryTable ? 'branchId._id' : '_id'}
                pagination={{ pageSize: 10 }}
                bordered
                scroll={{ x: 'max-content' }}
                summary={(data) => {
                  if (!data.length) return null;
                  
                  const totals = {
                    expenses: 0,
                    expenseDetails: [],
                    categoryTotals: expenseCategories.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {}),
                  };
                
                  if (showSummaryTable) {
                    data.forEach(record => {
                      totals.expenses += record.expenses || 0;
                      totals.expenseDetails.push(...(record.expenseDetails || []));
                      expenseCategories.forEach(category => {
                        totals.categoryTotals[category] += record.categoryTotals[category] || 0;
                      });
                    });
                  } else {
                    const uniqueDetails = new Map();
                    data.forEach(record => {
                      totals.expenses += record.expenses || 0;
                      (record.expenseDetails || []).forEach(detail => {
                        const detailKey = `${detail.recipient}-${detail.amount}-${detail.reason}`;
                        if (!uniqueDetails.has(detailKey)) {
                          uniqueDetails.set(detailKey, detail);
                          totals.expenseDetails.push(detail);
                          const reason = expenseCategories.includes(detail.reason) 
                            ? detail.reason 
                            : 'OTHERS';
                          totals.categoryTotals[reason] += detail.amount || 0;
                        }
                      });
                    });
                  }

                  return (
                    <Table.Summary.Row style={{ backgroundColor: '#2c3e50', color: '#ffffff' }}>
                      <Table.Summary.Cell index={0} />
                      <Table.Summary.Cell index={1}>
                        <Text strong style={{ fontSize: '12px', color: '#ffffff' }}>Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <Text
                          strong
                          style={{ fontSize: '16px', fontWeight: '700', cursor: totals.expenses > 0 ? 'pointer' : 'default', color: '#ffffff' }}
                          onClick={() =>
                            totals.expenses > 0 &&
                            handleViewExpenses(
                              { expenseDetails: totals.expenseDetails, _id: 'total' },
                              showSummaryTable ? 'All Branches' : 'All Entries',
                              null,
                              null
                            )
                          }
                        >
                          ₹{formatNumber(totals.expenses)}
                        </Text>
                      </Table.Summary.Cell>
                      {expenseCategories.map((category, catIndex) => (
                        <Table.Summary.Cell key={category} index={3 + catIndex}>
                          <Text
                            strong
                            style={{ fontSize: '16px', fontWeight: '700', cursor: totals.categoryTotals[category] > 0 ? 'pointer' : 'default', color: '#ffffff' }}
                            onClick={() =>
                              totals.categoryTotals[category] > 0 &&
                              handleViewExpenses(
                                { expenseDetails: totals.expenseDetails, _id: 'total' },
                                showSummaryTable ? 'All Branches' : 'All Entries',
                                null,
                                category
                              )
                            }
                          >
                            ₹{formatNumber(totals.categoryTotals[category])}
                          </Text>
                        </Table.Summary.Cell>
                      ))}
                      <Table.Summary.Cell index={3 + expenseCategories.length} />
                    </Table.Summary.Row>
                  );
                }}
              />
            </Card>
            <div className="charts-section">
              {filteredEntries.length > 0 ? (
                <>
                  <div className="doughnut-row">
                    <Card className="doughnut-card">
                      <div style={{ textAlign: 'center' }}>
                        <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '10px' }}>
                          Branch-Wise Expenses
                        </Text>
                        <div className="chart-container doughnut">
                          <Doughnut data={branchChartData} options={branchChartOptions} />
                        </div>
                      </div>
                    </Card>
                    <Card className="doughnut-card">
                      <div style={{ textAlign: 'center' }}>
                        <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '10px' }}>
                          Category-Wise Expenses
                        </Text>
                        <div className="chart-container doughnut">
                          <Doughnut data={categoryChartData} options={categoryChartOptions} />
                        </div>
                      </div>
                    </Card>
                  </div>
                  <Card className="bar-card">
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '10px' }}>
                        Date-Wise Expenses
                      </Text>
                      <div className="chart-container bar">
                        <Bar data={barChartData} options={barChartOptions} />
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <Card
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    background: '#fff',
                    marginBottom: '20px',
                    width: '100%',
                  }}
                >
                  <Text style={{ display: 'block', textAlign: 'center', padding: '20px' }}>
                    No data to display
                  </Text>
                </Card>
              )}
            </div>
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
                          ₹{formatNumber(expenseDetails.reduce((sum, item) => sum + (item.amount || 0), 0))}
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

export default ExpenseEntry;
