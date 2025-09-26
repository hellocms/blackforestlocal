import React, { useState, useEffect } from 'react';
import { Table, Input, Select, InputNumber, Button, message, Spin, Space, DatePicker, Typography, Card } from 'antd';
import { SaveOutlined, SearchOutlined, ClearOutlined, PrinterOutlined, StockOutlined, FileTextOutlined, FileDoneOutlined, DollarOutlined } from '@ant-design/icons'; // Added new icons
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ExpenseEntry = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [dateFilterType, setDateFilterType] = useState('Updated');

  useEffect(() => {
    fetchBills();
    fetchDealers();
    fetchBranches();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/dealers/bills', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      const result = await response.json();
      if (response.ok) {
        setBills(result);
        setFilteredBills(result);
      } else {
        message.error(result.message || 'Failed to fetch bills');
      }
    } catch (err) {
      message.error('Server error while fetching bills');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealers = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/dealers', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        setDealers(result);
      } else {
        message.error('Failed to fetch dealers');
      }
    } catch (err) {
      message.error('Server error while fetching dealers');
      console.error('Error:', err);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/branches/public', {
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

  const handleSearch = (value) => {
    setSearchText(value);
    filterBills(value, selectedDealer, selectedBranch, selectedStatus, selectedDateRange, dateFilterType);
  };

  const handleDealerFilter = (value) => {
    setSelectedDealer(value);
    filterBills(searchText, value, selectedBranch, selectedStatus, selectedDateRange, dateFilterType);
  };

  const handleBranchFilter = (value) => {
    setSelectedBranch(value);
    filterBills(searchText, selectedDealer, value, selectedStatus, selectedDateRange, dateFilterType);
  };

  const handleStatusFilter = (value) => {
    setSelectedStatus(value);
    filterBills(searchText, selectedDealer, selectedBranch, value, selectedDateRange, dateFilterType);
  };

  const handleDateFilter = (dates) => {
    setSelectedDateRange(dates);
    filterBills(searchText, selectedDealer, selectedBranch, selectedStatus, dates, dateFilterType);
  };

  const handleDateFilterTypeChange = (value) => {
    setDateFilterType(value);
    filterBills(searchText, selectedDealer, selectedBranch, selectedStatus, selectedDateRange, value);
  };

  const filterBills = (search, dealerId, branchId, status, dateRange, filterType) => {
    let filtered = [...bills];

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (bill) =>
          bill.billNumber.toLowerCase().includes(lowerSearch) ||
          (bill.branch?.name && bill.branch.name.toLowerCase().includes(lowerSearch)) ||
          (bill.dealer?.dealer_name && bill.dealer.dealer_name.toLowerCase().includes(lowerSearch))
      );
    }

    if (dealerId) {
      filtered = filtered.filter((bill) => bill.dealer?._id === dealerId);
    }

    if (branchId) {
      filtered = filtered.filter((bill) => bill.branch?._id === branchId);
    }

    if (status) {
      filtered = filtered.filter((bill) => bill.status === status);
    }

    if (dateRange && dateRange.length === 2) {
      const startDate = dayjs(dateRange[0]).startOf('day');
      const endDate = dayjs(dateRange[1]).endOf('day');
      filtered = filtered.filter((bill) => {
        const billDate = filterType === 'Created' ? dayjs(bill.created_at) : dayjs(bill.updatedAt);
        return billDate.isValid() && billDate.isBetween(startDate, endDate, null, '[]');
      });
    }

    setFilteredBills(filtered);
  };

  const handlePaidChange = (billId, value) => {
    setBills((prevBills) =>
      prevBills.map((bill) =>
        bill._id === billId ? { ...bill, paid: value || 0 } : bill
      )
    );
    setFilteredBills((prevFiltered) =>
      prevFiltered.map((bill) =>
        bill._id === billId ? { ...bill, paid: value || 0 } : bill
      )
    );
  };

  const handleSave = async (bill) => {
    setUpdatingId(bill._id);
    const formData = new FormData();
    formData.append('paid', bill.paid);

    try {
      const response = await fetch(`http://localhost:5001/api/dealers/bills/${bill._id}`, {
        method: 'PUT',
        body: formData,
      });
      const result = await response.json();
      if (response.ok) {
        message.success('Payment updated successfully');
        setBills((prevBills) =>
          prevBills.map((b) => (b._id === bill._id ? result.bill : b))
        );
        setFilteredBills((prevFiltered) =>
          prevFiltered.map((b) => (b._id === bill._id ? result.bill : b))
        );
      } else {
        message.error(result.message || 'Failed to update payment');
      }
    } catch (err) {
      message.error('Server error while updating payment');
      console.error('Error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedDealer(null);
    setSelectedBranch(null);
    setSelectedStatus(null);
    setSelectedDateRange(null);
    setDateFilterType('Updated');
    setFilteredBills(bills);
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Expense Entry List</title>
          <style>
            @media print {
              @page { size: A4; margin: 20mm; }
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Expense Entry List</h1>
          <table>
            <thead>
              <tr>
                <th>Serial No</th>
                <th>Bill No</th>
                <th>Branch Name</th>
                <th>Dealer Name</th>
                <th>Amount (₹)</th>
                <th>Paid (₹)</th>
                <th>Pending (₹)</th>
                <th>Status</th>
                <th>Updated At</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBills
                .map(
                  (bill, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${bill.billNumber}</td>
                      <td>${bill.branch?.name || 'N/A'}</td>
                      <td>${bill.dealer?.dealer_name || 'N/A'}</td>
                      <td>₹${bill.amount.toFixed(2)}</td>
                      <td>₹${bill.paid.toFixed(2)}</td>
                      <td>₹${bill.pending.toFixed(2)}</td>
                      <td>${bill.status}</td>
                      <td>${bill.updatedAt ? dayjs(bill.updatedAt).local().format('YYYY-MM-DD HH:mm:ss') : 'N/A'}</td>
                      <td>${bill.created_at ? dayjs(bill.created_at).local().format('YYYY-MM-DD HH:mm:ss') : 'N/A'}</td>
                    </tr>
                  `
                )
                .join('')}
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
      title: 'Bill No',
      dataIndex: 'billNumber',
      key: 'billNumber',
    },
    {
      title: 'Branch Name',
      dataIndex: ['branch', 'name'],
      key: 'branchName',
      render: (name) => name || 'N/A',
    },
    {
      title: 'Dealer Name',
      dataIndex: ['dealer', 'dealer_name'],
      key: 'dealerName',
      render: (dealer_name) => dealer_name || 'N/A',
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Paid (₹)',
      dataIndex: 'paid',
      key: 'paid',
      render: (paid, record) => (
        <InputNumber
          min={0}
          max={record.amount}
          value={paid}
          onChange={(value) => handlePaidChange(record._id, value)}
          formatter={(value) => `₹${value}`}
          parser={(value) => value.replace('₹', '')}
          style={{ width: '120px' }}
        />
      ),
    },
    {
      title: 'Pending (₹)',
      dataIndex: 'pending',
      key: 'pending',
      render: (pending) => `₹${pending.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Updated & Created',
      key: 'dates',
      render: (_, record) => {
        const created = record.created_at
          ? dayjs.utc(record.created_at).local().format('YYYY-MM-DD HH:mm:ss')
          : 'N/A';
        const updated = record.updatedAt
          ? dayjs.utc(record.updatedAt).local().format('YYYY-MM-DD HH:mm:ss')
          : 'N/A';
        return (
          <div>
            {created}
            <br />
            {updated}
          </div>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => handleSave(record)}
          loading={updatingId === record._id}
          style={{ background: 'linear-gradient(to right, #34495e, #1a3042)', borderColor: '#34495e' }}
        >
          Save
        </Button>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: '40px 20px',
        background: 'linear-gradient(to bottom, #f0f2f5, #e6e9f0)', // Added gradient background
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ maxWidth: '1600px', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <Space>
            {/* Stock Add Icon Button */}
            <Button
              type="default"
              size="large"
              icon={<StockOutlined />}
              href="https://app.theblackforestcakes.com/dealers/stock-entry/create"
            />
            {/* Stock List Button */}
            <Button
              type="default"
              size="large"
              href="https://app.theblackforestcakes.com/dealers/stock-entry/list"
            >
              Stock List
            </Button>
            {/* Bill Entry Add Icon Button */}
            <Button
              type="default"
              size="large"
              icon={<FileTextOutlined />}
              href="https://app.theblackforestcakes.com/dealers/bill-entry/create"
            />
            {/* Bill Entry List Button */}
            <Button
              type="default"
              size="large"
              href="https://app.theblackforestcakes.com/dealers/bill-entry/list"
            >
              Bill Entry
            </Button>
            {/* Closing Entry Add Icon Button */}
            <Button
              type="default"
              size="large"
              icon={<FileDoneOutlined />}
              href="https://app.theblackforestcakes.com/dealers/closing-entry/closingentry"
            />
            {/* Closing Entry List Button */}
            <Button
              type="default"
              size="large"
              href="https://app.theblackforestcakes.com/dealers/closing-entry/list"
            >
              Closing Entry List
            </Button>
            {/* Expense Entry Button (Unchanged) */}
            <Button
              type="default"
              size="large"
              icon={<DollarOutlined />}
              href="https://app.theblackforestcakes.com/dealers/expense/ExpenseEntry"
            >
              Expense Entry
            </Button>
          </Space>

          <Title
            level={2}
            style={{
              margin: 0,
              color: '#1a3042',
              fontWeight: 'bold',
              flexGrow: 1,
              textAlign: 'center',
            }}
          >
            Expense Entry
          </Title>

          <div style={{ width: '300px' }}></div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Card
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                background: '#fff',
                marginBottom: '20px',
              }}
            >
              <Space wrap style={{ width: '100%', padding: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Search</Text>
                  <Input
                    placeholder="Search by Bill No, Branch, or Dealer"
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                    prefix={<SearchOutlined />}
                    style={{ width: '200px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Dealer</Text>
                  <Select
                    placeholder="Filter by Dealer"
                    value={selectedDealer}
                    onChange={handleDealerFilter}
                    allowClear
                    style={{ width: '200px' }}
                  >
                    {dealers.map((dealer) => (
                      <Option key={dealer._id} value={dealer._id}>
                        {dealer.dealer_name}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Branch</Text>
                  <Select
                    placeholder="Filter by Branch"
                    value={selectedBranch}
                    onChange={handleBranchFilter}
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
                  <Text strong>Status</Text>
                  <Select
                    placeholder="Filter by Status"
                    value={selectedStatus}
                    onChange={handleStatusFilter}
                    allowClear
                    style={{ width: '200px' }}
                  >
                    <Option value="Pending">Pending</Option>
                    <Option value="Completed">Completed</Option>
                  </Select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Date Filter</Text>
                  <Space>
                    <Select
                      value={dateFilterType}
                      onChange={handleDateFilterTypeChange}
                      style={{ width: '120px' }}
                    >
                      <Option value="Created">Created</Option>
                      <Option value="Updated">Updated</Option>
                    </Select>
                    <RangePicker
                      value={selectedDateRange}
                      onChange={handleDateFilter}
                      format="YYYY-MM-DD"
                      style={{ width: '250px' }}
                    />
                  </Space>
                </div>
                <Space style={{ marginTop: '20px' }}>
                  <Button
                    icon={<PrinterOutlined />}
                    onClick={handlePrint}
                  />
                  <Button
                    type="default"
                    icon={<ClearOutlined />}
                    onClick={clearFilters}
                  >
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
              }}
            >
              <Table
                columns={columns}
                dataSource={filteredBills}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
                bordered
              />
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

ExpenseEntry.useLayout = false;
export default ExpenseEntry;