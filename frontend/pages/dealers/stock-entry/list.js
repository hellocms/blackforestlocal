import React, { useState, useEffect } from 'react';
import { Table, Button, message, Popconfirm, Input, Select, DatePicker, Space, Spin, Typography, Card } from 'antd';
import { EditFilled, DeleteFilled, SearchOutlined, ClearOutlined, PrinterOutlined, FileTextOutlined, DollarOutlined, FileDoneOutlined } from '@ant-design/icons'; // Added FileDoneOutlined
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const StockEntryList = () => {
  const [stockEntries, setStockEntries] = useState([]);
  const [filteredStockEntries, setFilteredStockEntries] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const router = useRouter();

  // Fetch stock entries from the backend
  const fetchStockEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/dealer/stock-entries', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        console.log('Stock Entries Data:', result);
        setStockEntries(result);
        setFilteredStockEntries(result);
      } else {
        message.error(result.message || 'Failed to fetch stock entries');
      }
    } catch (err) {
      message.error('Server error while fetching stock entries');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dealers
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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/dealer/categories', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        setCategories(result);
      } else {
        message.error('Failed to fetch categories');
      }
    } catch (err) {
      message.error('Server error while fetching categories');
      console.error('Error:', err);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/dealer/products', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        setProducts(result);
      } else {
        message.error('Failed to fetch products');
      }
    } catch (err) {
      message.error('Server error while fetching products');
      console.error('Error:', err);
    }
  };

  // Handle delete action with confirmation
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/dealer/stock-entries/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (response.ok) {
        message.success(result.message || 'Stock entry deleted successfully');
        fetchStockEntries(); // Refresh the list
      } else {
        message.error(result.message || 'Failed to delete stock entry');
      }
    } catch (err) {
      message.error('Server error while deleting stock entry');
      console.error('Error:', err);
    }
  };

  useEffect(() => {
    fetchStockEntries();
    fetchDealers();
    fetchCategories();
    fetchProducts();
  }, []);

  // Filter handling
  const handleSearch = (value) => {
    setSearchText(value);
    filterStockEntries(value, selectedDealer, selectedCategory, selectedProduct, selectedDateRange);
  };

  const handleDealerFilter = (value) => {
    setSelectedDealer(value);
    filterStockEntries(searchText, value, selectedCategory, selectedProduct, selectedDateRange);
  };

  const handleCategoryFilter = (value) => {
    setSelectedCategory(value);
    filterStockEntries(searchText, selectedDealer, value, selectedProduct, selectedDateRange);
  };

  const handleProductFilter = (value) => {
    setSelectedProduct(value);
    filterStockEntries(searchText, selectedDealer, selectedCategory, value, selectedDateRange);
  };

  const handleDateFilter = (dates) => {
    setSelectedDateRange(dates);
    filterStockEntries(searchText, selectedDealer, selectedCategory, selectedProduct, dates);
  };

  const filterStockEntries = (search, dealerId, categoryId, productId, dateRange) => {
    let filtered = [...stockEntries];

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          (entry.dealer?.dealer_name && entry.dealer.dealer_name.toLowerCase().includes(lowerSearch)) ||
          (entry.category?.category_name && entry.category.category_name.toLowerCase().includes(lowerSearch)) ||
          (entry.product?.product_name && entry.product.product_name.toLowerCase().includes(lowerSearch))
      );
    }

    if (dealerId) {
      filtered = filtered.filter((entry) => entry.dealer?._id === dealerId);
    }

    if (categoryId) {
      filtered = filtered.filter((entry) => entry.category?._id === categoryId);
    }

    if (productId) {
      filtered = filtered.filter((entry) => entry.product?._id === productId);
    }

    if (dateRange && dateRange.length === 2) {
      const startDate = dayjs(dateRange[0]).startOf('day');
      const endDate = dayjs(dateRange[1]).endOf('day');
      filtered = filtered.filter((entry) => {
        const entryDate = dayjs(entry.created_at);
        return entryDate.isValid() && entryDate.isBetween(startDate, endDate, null, '[]');
      });
    }

    setFilteredStockEntries(filtered);
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedDealer(null);
    setSelectedCategory(null);
    setSelectedProduct(null);
    setSelectedDateRange(null);
    setFilteredStockEntries(stockEntries);
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Stock Entry List</title>
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
          <h1>Stock Entry List</h1>
          <table>
            <thead>
              <tr>
                <th>Serial No</th>
                <th>Dealer Name</th>
                <th>Category Name</th>
                <th>Product Name</th>
                <th>Pieces Count</th>
                <th>Amount (₹)</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${filteredStockEntries
                .map(
                  (entry, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${entry.dealer?.dealer_name || 'N/A'}</td>
                      <td>${entry.category?.category_name || 'N/A'}</td>
                      <td>${entry.product?.product_name || 'N/A'}</td>
                      <td>${entry.pcs_count}</td>
                      <td>${entry.amount}</td>
                      <td>${dayjs(entry.created_at).local().format('YYYY-MM-DD HH:mm:ss')}</td>
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

  // Define table columns
  const columns = [
    {
      title: 'Serial No',
      key: 'serial_no',
      render: (_, __, index) => index + 1,
      width: 80,
    },
    {
      title: 'Dealer Name',
      dataIndex: ['dealer', 'dealer_name'],
      key: 'dealer_name',
      render: (text, record) => {
        if (!record.dealer) return 'N/A';
        if (typeof record.dealer === 'string') return record.dealer;
        return record.dealer.dealer_name || 'N/A';
      },
    },
    {
      title: 'Category Name',
      dataIndex: ['category', 'category_name'],
      key: 'category_name',
    },
    {
      title: 'Product Name',
      dataIndex: ['product', 'product_name'],
      key: 'product_name',
    },
    {
      title: 'Pieces Count',
      dataIndex: 'pcs_count',
      key: 'pcs_count',
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => {
        const parsedDate = dayjs(text).local();
        return parsedDate.isValid() ? parsedDate.format('YYYY-MM-DD HH:mm:ss') : 'N/A';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditFilled />}
            style={{ color: '#1890ff', padding: '0 8px' }}
            onClick={() => router.push(`/dealers/stock-entry/edit/${record._id}`)}
          />
          <Popconfirm
            title="Are you sure you want to delete this stock entry?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              icon={<DeleteFilled />}
              style={{ color: '#ff4d4f', padding: '0 8px' }}
            />
          </Popconfirm>
        </Space>
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
            {/* Bill Entry Icon Button (Create) */}
            <Button
              type="default"
              size="large"
              icon={<FileTextOutlined />}
              href="https://app.theblackforestcakes.com/dealers/bill-entry/create"
            />
            {/* Bill Entry Text Button (List) */}
            <Button
              type="default"
              size="large"
              href="https://app.theblackforestcakes.com/dealers/bill-entry/list"
            >
              Bill Entry
            </Button>
            {/* Closing Entry Icon Button (Create) */}
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
            Stock Entry List
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
                    placeholder="Search by dealer, category, or product"
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
                  <Text strong>Category</Text>
                  <Select
                    placeholder="Filter by Category"
                    value={selectedCategory}
                    onChange={handleCategoryFilter}
                    allowClear
                    style={{ width: '200px' }}
                  >
                    {categories.map((category) => (
                      <Option key={category._id} value={category._id}>
                        {category.category_name}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Product</Text>
                  <Select
                    placeholder="Filter by Product"
                    value={selectedProduct}
                    onChange={handleProductFilter}
                    allowClear
                    style={{ width: '200px' }}
                  >
                    {products.map((product) => (
                      <Option key={product._id} value={product._id}>
                        {product.product_name}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Date Range</Text>
                  <RangePicker
                    value={selectedDateRange}
                    onChange={handleDateFilter}
                    format="YYYY-MM-DD"
                    placeholder={['Created Start', 'Created End']}
                    style={{ width: '250px' }}
                  />
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
                dataSource={filteredStockEntries}
                loading={loading}
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

// Opt out of Layout component
StockEntryList.useLayout = false;
export default StockEntryList;