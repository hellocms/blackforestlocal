import React, { useState, useEffect } from 'react';
import { Table, Button, message, Row, Col, Popconfirm } from 'antd';
import { EditFilled, DeleteFilled, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const DealerCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // State for responsive design
  const router = useRouter();

  // Fetch categories from the backend
  const fetchCategories = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Handle delete action with confirmation
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/dealer/categories/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (response.ok) {
        message.success(result.message || 'Dealer category deleted successfully');
        fetchCategories(); // Refresh the list
      } else {
        message.error(result.message || 'Failed to delete category');
      }
    } catch (err) {
      message.error('Server error while deleting category');
      console.error('Error:', err);
    }
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
    fetchCategories();
  }, []);

  // Desktop columns with Serial No, removed Description and Created At, bold Category Name
  const columns = [
    {
      title: 'S.No',
      key: 'serial_no',
      width: '10%',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Category Name',
      dataIndex: 'category_name',
      key: 'category_name',
      width: '40%',
      ellipsis: true,
      render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>, // Bold Category Name
    },
    {
      title: 'Parent Category',
      dataIndex: 'parent_category',
      key: 'parent_category',
      width: '40%',
      render: (parent) => (parent ? parent.category_name : '-'),
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
            onClick={() => router.push(`/dealers/category/edit/${record._id}`)}
          />
          <Popconfirm
            title="Are you sure you want to delete this category?"
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

  // Mobile columns with Serial No, removed Description and Created At, bold Category Name
  const mobileColumns = [
    {
      title: 'S.No',
      key: 'serial_no',
      width: '20%',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Category Info',
      key: 'category_info',
      render: (_, record) => (
        <div>
          <strong>{record.category_name}</strong><br />
          Parent: {record.parent_category ? record.parent_category.category_name : '-'}
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
            onClick={() => router.push(`/dealers/category/edit/${record._id}`)}
          />
          <Popconfirm
            title="Are you sure you want to delete this category?"
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
        <Col xs={24} sm={24} md={24} lg={24} xl={24}> {/* Maximized table size */}
          <h1 style={{ 
            color: '#000000', 
            textAlign: 'center', 
            marginBottom: '30px', 
            fontSize: '24px', 
            fontWeight: 'bold' 
          }}>
            Dealer Category List
          </h1>
          <div style={{ 
            background: '#ffffff', 
            padding: '40px', // Increased padding for larger appearance
            borderRadius: '10px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
            width: '100%' 
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              marginBottom: '20px' 
            }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push('/dealers/category/create')}
                style={{
                  background: 'linear-gradient(to right, #34495e, #1a3042)',
                  borderColor: '#34495e',
                  color: '#ffffff',
                }}
              >
                Create Dealer Category
              </Button>
            </div>
            <Table
              columns={isMobile ? mobileColumns : columns}
              dataSource={categories}
              loading={loading}
              rowKey="_id"
              pagination={{ 
                pageSize: 50, // Increased to 50 items per page
                defaultPageSize: 50,
                showSizeChanger: true, 
                pageSizeOptions: ['10', '20', '50', '100'],
                style: { marginTop: '20px', textAlign: 'center' } 
              }}
              style={{ width: '100%' }}
              tableLayout="fixed"
              scroll={{ x: false }} // Remove horizontal scroll
              responsive={['xs', 'sm', 'md', 'lg', 'xl']}
              bordered // Add borders for rows
              className="custom-table" // Custom class for column lines
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

export default DealerCategoryList;