import React, { useState, useEffect } from 'react';
import { Table, Button, message, Row, Col, Popconfirm, Modal } from 'antd';
import { EditFilled, DeleteFilled, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

// Utility function to limit words
const limitWords = (text, limit = 5) => {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length > limit) {
    return words.slice(0, limit).join(' ') + '...';
  }
  return text;
};

const DealerList = () => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const router = useRouter();

  // Fetch dealers from the backend
  const fetchDealers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/dealers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok) {
        setDealers(result);
      } else {
        message.error(result.message || 'Failed to fetch dealers');
      }
    } catch (err) {
      message.error('Server error while fetching dealers');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete action
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/dealers/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (response.ok) {
        message.success(result.message || 'Dealer deleted successfully');
        fetchDealers();
      } else {
        message.error(result.message || 'Failed to delete dealer');
      }
    } catch (err) {
      message.error('Server error while deleting dealer');
      console.error('Error:', err);
    }
  };

  // Detect screen size on the client side
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
    fetchDealers();
  }, []);

  // Handle modal open/close
  const showModal = (dealer) => {
    setSelectedDealer(dealer);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedDealer(null);
  };

  // Desktop columns with adjusted Doc title to prevent breaking
  const columns = [
    {
      title: 'S.No',
      key: 'serial_no',
      width: '10%',
      render: (text, record, index) => index + 1,
    },
    { 
      title: 'Dealer Name', 
      dataIndex: 'dealer_name', 
      key: 'dealer_name', 
      width: '25%',
      ellipsis: true,
      render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    { 
      title: 'Address', 
      dataIndex: 'address', 
      key: 'address', 
      width: '30%',
      render: (text) => limitWords(text, 5),
      ellipsis: true 
    },
    { 
      title: 'Phone Number', 
      dataIndex: 'phone_no', 
      key: 'phone_no', 
      width: '15%'
    },
    { 
      title: 'GST', 
      dataIndex: 'gst', 
      key: 'gst', 
      width: '15%',
      render: (text) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span>,
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>Doc</span>, // Prevent title breaking
      key: 'doc',
      width: '5%',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          style={{ color: '#1890ff', padding: '0 8px' }}
          onClick={() => showModal(record)}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            icon={<EditFilled />}
            style={{
              backgroundColor: '#d9d9d9',
              border: '1px solid #d9d9d9',
              color: '#1890ff',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
            onClick={() => router.push(`/dealers/edit/${record._id}`)}
          />
          <Popconfirm
            title="Are you sure you want to delete this dealer?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              icon={<DeleteFilled />}
              style={{
                backgroundColor: '#d9d9d9',
                border: '1px solid #d9d9d9',
                color: '#ff4d4f',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  // Mobile columns with adjusted Doc title to prevent breaking
  const mobileColumns = [
    {
      title: 'S.No',
      key: 'serial_no',
      width: '20%',
      render: (text, record, index) => index + 1,
    },
    { 
      title: 'Dealer Info', 
      key: 'dealer_info',
      render: (_, record) => (
        <div>
          <strong>{record.dealer_name}</strong><br />
          {limitWords(record.address, 5)}<br />
          Phone: {record.phone_no}<br />
          GST: <span style={{ whiteSpace: 'nowrap' }}>{record.gst}</span>
        </div>
      )
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>Doc</span>, // Prevent title breaking
      key: 'doc',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          style={{ color: '#1890ff', padding: '0 8px' }}
          onClick={() => showModal(record)}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            icon={<EditFilled />}
            style={{
              backgroundColor: '#d9d9d9',
              border: '1px solid #d9d9d9',
              color: '#1890ff',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
            onClick={() => router.push(`/dealers/edit/${record._id}`)}
          />
          <Popconfirm
            title="Are you sure you want to delete this dealer?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              icon={<DeleteFilled />}
              style={{
                backgroundColor: '#d9d9d9',
                border: '1px solid #d9d9d9',
                color: '#ff4d4f',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
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
            Dealer List
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
              justifyContent: 'flex-end', 
              marginBottom: '20px' 
            }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push('/dealers/create')}
                style={{
                  background: 'linear-gradient(to right, #34495e, #1a3042)',
                  borderColor: '#34495e',
                  color: '#ffffff',
                }}
              >
                Create Dealer
              </Button>
            </div>
            <Table
              columns={isMobile ? mobileColumns : columns}
              dataSource={dealers}
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

      {/* Modal for displaying TAN, PAN, MSME details */}
      <Modal
        title="Dealer Documents"
        visible={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="close" onClick={handleModalClose}>
            Close
          </Button>,
        ]}
      >
        {selectedDealer && (
          <div>
            <p><strong>TAN:</strong> {selectedDealer.tan || 'N/A'}</p>
            <p><strong>PAN:</strong> {selectedDealer.pan || 'N/A'}</p>
            <p><strong>MSME:</strong> {selectedDealer.msme || 'N/A'}</p>
          </div>
        )}
      </Modal>
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

export default DealerList;