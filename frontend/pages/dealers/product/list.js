import React, { useState, useEffect } from 'react';
import { Table, Button, message, Row, Col, Popconfirm, Input, Select } from 'antd';
import { EditFilled, DeleteFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const { Option } = Select;

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); // State for filtered products
  const [categories, setCategories] = useState([]); // State for category filter options
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchText, setSearchText] = useState(''); // State for search text
  const [selectedCategory, setSelectedCategory] = useState(null); // State for selected category
  const router = useRouter();

  // Fetch products from the backend
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/dealer/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok) {
        setProducts(result);
        setFilteredProducts(result); // Initialize filtered products
      } else {
        message.error(result.message || 'Failed to fetch products');
      }
    } catch (err) {
      message.error('Server error while fetching products');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for the filter dropdown
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/dealer/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok) {
        setCategories(result);
      } else {
        message.error(result.message || 'Failed to fetch categories');
      }
    } catch (err) {
      message.error('Server error while fetching categories');
      console.error('Error:', err);
    }
  };

  // Handle delete action with confirmation
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/dealer/products/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (response.ok) {
        message.success(result.message || 'Product deleted successfully');
        fetchProducts(); // Refresh the list
      } else {
        message.error(result.message || 'Failed to delete product');
      }
    } catch (err) {
      message.error('Server error while deleting product');
      console.error('Error:', err);
    }
  };

  // Handle search functionality
  const handleSearch = (value) => {
    setSearchText(value);
    filterProducts(value, selectedCategory);
  };

  // Handle category filter
  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    filterProducts(searchText, value);
  };

  // Filter products based on search text and category
  const filterProducts = (search, category) => {
    let filtered = products;

    // Filter by search text (product name or barcode)
    if (search) {
      filtered = filtered.filter(
        (product) =>
          (product.product_name && product.product_name.toLowerCase().includes(search.toLowerCase())) ||
          (product.barcode_no && product.barcode_no.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter(
        (product) => product.category && product.category._id === category
      );
    }

    setFilteredProducts(filtered);
  };

  // Detect screen size on the client side to avoid SSR issues
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 768);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories(); // Fetch categories for the filter
  }, []);

  // Desktop columns with Serial No, bold Product Name
  const columns = [
    {
      title: 'S.No',
      key: 'serial_no',
      width: '10%',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Product Name',
      dataIndex: 'product_name',
      key: 'product_name',
      width: '25%',
      ellipsis: true,
      render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '20%',
      render: (category) => (category ? category.category_name : '-'),
    },
    {
      title: 'Barcode No',
      dataIndex: 'barcode_no',
      key: 'barcode_no',
      width: '15%',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: '15%',
      render: (price) => (price ? `₹${price.toFixed(2)}` : '-'),
    },
    {
      title: 'Stock Quantity',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: '15%',
      render: (qty) => (qty !== undefined ? qty : '-'),
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            type="link"
            icon={<EditFilled />}
            style={{ color: '#1890ff', padding: '0 8px' }}
            onClick={() => router.push(`/dealers/product/edit/${record._id}`)}
          />
          <Popconfirm
            title="Are you sure you want to delete this product?"
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
        </div>
      ),
    },
  ];

  // Mobile columns with Serial No, bold Product Name
  const mobileColumns = [
    {
      title: 'S.No',
      key: 'serial_no',
      width: '20%',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Product Info',
      key: 'product_info',
      render: (_, record) => (
        <div>
          <strong>{record.product_name}</strong><br />
          Category: {record.category ? record.category.category_name : '-'}<br />
          Barcode: {record.barcode_no || '-'}<br />
          Price: {record.price ? `₹${record.price.toFixed(2)}` : '-'}<br />
          Stock: {record.stock_quantity !== undefined ? record.stock_quantity : '-'}
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            type="link"
            icon={<EditFilled />}
            style={{ color: '#1890ff', padding: '0 8px' }}
            onClick={() => router.push(`/dealers/product/edit/${record._id}`)}
          />
          <Popconfirm
            title="Are you sure you want to delete this product?"
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
        </div>
      ),
    },
  ];

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
          <h1 style={{ 
            color: '#000000', 
            textAlign: 'center', 
            marginBottom: '30px', 
            fontSize: '24px', 
            fontWeight: 'bold' 
          }}>
            Product List
          </h1>
          <div style={{ 
            background: '#ffffff', 
            padding: '40px', 
            borderRadius: '10px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
            width: '100%' 
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', // Space between left and right elements
              alignItems: 'center', // Vertically center the elements
              marginBottom: '20px',
              flexWrap: 'wrap', // Allow wrapping on smaller screens
              gap: '10px', // Add spacing between elements
            }}>
              {/* Left side: Search bar and Category filter */}
              <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '300px' }}>
                <Input
                  placeholder="Search by Product Name or Barcode"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: '50%' }}
                />
                <Select
                  placeholder="Filter by Category"
                  style={{ width: '50%' }}
                  onChange={handleCategoryChange}
                  value={selectedCategory}
                  allowClear
                >
                  {categories.map((category) => (
                    <Option key={category._id} value={category._id}>
                      {category.category_name}
                    </Option>
                  ))}
                </Select>
              </div>
              {/* Right side: Create Product button */}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push('/dealers/product/create')}
                style={{
                  background: 'linear-gradient(to right, #34495e, #1a3042)',
                  borderColor: '#34495e',
                  color: '#ffffff',
                }}
              >
                Create Product
              </Button>
            </div>
            <Table
              columns={isMobile ? mobileColumns : columns}
              dataSource={filteredProducts} // Use filtered products
              loading={loading}
              rowKey="_id"
              pagination={{ 
                pageSize: 50,
                defaultPageSize: 50,
                showSizeChanger: true, 
                pageSizeOptions: ['10', '20', '50', '100'],
                style: { marginTop: '20px', textAlign: 'center' } 
              }}
              style={{ width: '100%' }}
              tableLayout="fixed"
              scroll={{ x: false }}
              responsive={['xs', 'sm', 'md', 'lg', 'xl']}
              bordered
              className="custom-table"
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

// Add custom CSS for column lines
const styles = `
  .custom-table .ant-table-thead > tr > th {
    border-right: 1px solid #f0f0f0;
  }
  .custom-table .ant-table-tbody > tr > td {
    border-right: 1px solid #f0f0f0;
  }
  .custom-table .ant-table-thead > tr > th:last-child,
  .custom-table .ant-table-tbody > tr > td:last-child {
    border-right: none;
  }
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default ProductList;