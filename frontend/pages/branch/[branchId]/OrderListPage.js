import React, { useState, useEffect } from 'react';
import { Layout, Table, Button, Select, DatePicker, message, Modal, List, Space, Tag } from 'antd';
import { EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import moment from 'moment';
import { jwtDecode } from 'jwt-decode';

const { Header, Content } = Layout;
const { Option } = Select;
const { RangePicker } = DatePicker;

const OrderListPage = ({ branchId }) => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 });
  const [filters, setFilters] = useState({ status: null, dateRange: null });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [token, setToken] = useState(null);
  const [branchName, setBranchName] = useState('Unknown Branch');
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);

      if (!storedToken) {
        router.replace('/login');
        return;
      }

      try {
        const decoded = jwtDecode(storedToken);
        if (decoded.role !== 'branch') {
          router.replace('/login');
          return;
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        router.replace('/login');
      }

      fetchBranchDetails(storedToken, branchId);
      fetchOrders(storedToken, branchId, pagination.current, pagination.pageSize, filters);
    }
  }, [router, branchId, pagination.current, pagination.pageSize, filters]);

  const fetchBranchDetails = async (token, branchId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/branches`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const branch = data.find(b => b._id === branchId);
        if (branch) {
          setBranchName(branch.name || 'Unknown Branch');
        } else {
          message.error('Branch not found');
          setBranchName('Unknown Branch');
        }
      } else {
        message.error('Failed to fetch branch details');
        setBranchName('Unknown Branch');
      }
    } catch (error) {
      console.error('Fetch branch details error:', error);
      message.error('Error fetching branch details');
      setBranchName('Unknown Branch');
    }
  };

  const fetchOrders = async (token, branchId, page, pageSize, filters) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: pageSize,
      });
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.dateRange) {
        queryParams.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
        queryParams.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
      }

      const response = await fetch(`${BACKEND_URL}/api/orders/branch/${branchId}?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders);
        setPagination({
          current: data.pagination.page,
          pageSize: data.pagination.limit,
          total: data.pagination.total,
        });
      } else {
        message.error(data.message || 'Failed to fetch orders');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Error fetching orders');
      setOrders([]);
    }
    setLoading(false);
  };

  const handleTableChange = (pagination) => {
    setPagination({
      ...pagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const showOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedOrder(null);
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 150,
    },
    {
      title: 'Bill No',
      dataIndex: 'billNo',
      key: 'billNo',
      width: 120,
    },
    {
      title: 'Total Amount',
      key: 'totalWithGST',
      render: (_, record) => `₹${record.totalWithGST.toFixed(2)}`,
      width: 120,
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method) => method.charAt(0).toUpperCase() + method.slice(1),
      width: 130,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : 'blue'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
      width: 100,
    },
    {
      title: 'Waiter',
      key: 'waiterId',
      render: (_, record) => record.waiterId?.name || 'Not Assigned',
      width: 120,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => moment(date).format('DD-MM-YYYY HH:mm'),
      width: 150,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showOrderDetails(record)}
        >
          View Details
        </Button>
      ),
      width: 120,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#000000',
          padding: '0 20px',
          color: '#FFFFFF',
          height: '64px',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
            {branchName}
          </span>
        </div>
        <Button
          type="text"
          style={{ color: '#FFFFFF' }}
          onClick={() => router.push(`/billing/${branchId}`)}
        >
          Back to Billing
        </Button>
      </Header>
      <Content style={{ marginTop: '64px', padding: '20px', background: '#FFFFFF' }}>
        <h2 style={{ marginBottom: '20px' }}>Order List</h2>
        <Space style={{ marginBottom: '20px' }} wrap>
          <Select
            placeholder="Filter by Status"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => handleFilterChange('status', value)}
          >
            <Option value="draft">Draft</Option>
            <Option value="completed">Completed</Option>
          </Select>
          <RangePicker
            onChange={(dates) => handleFilterChange('dateRange', dates)}
            format="YYYY-MM-DD"
          />
        </Space>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
        <Modal
          title="Order Details"
          visible={isModalVisible}
          onCancel={handleModalClose}
          footer={[
            <Button key="close" onClick={handleModalClose}>
              Close
            </Button>,
          ]}
          width={600}
        >
          {selectedOrder && (
            <div>
              <p><strong>Order ID:</strong> {selectedOrder.orderId}</p>
              <p><strong>Bill No:</strong> {selectedOrder.billNo}</p>
              <p><strong>Branch:</strong> {selectedOrder.branchId?.name || 'Unknown'}</p>
              <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod.charAt(0).toUpperCase() + selectedOrder.paymentMethod.slice(1)}</p>
              <p><strong>Status:</strong> {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}</p>
              <p><strong>Waiter:</strong> {selectedOrder.waiterId?.name || 'Not Assigned'}</p>
              <p><strong>Created At:</strong> {moment(selectedOrder.createdAt).format('DD-MM-YYYY HH:mm')}</p>
              <p><strong>Subtotal:</strong> ₹{selectedOrder.subtotal.toFixed(2)}</p>
              <p><strong>GST:</strong> ₹{selectedOrder.totalGST.toFixed(2)}</p>
              <p><strong>Total:</strong> ₹{selectedOrder.totalWithGST.toFixed(2)}</p>
              <h3>Products</h3>
              <List
                dataSource={selectedOrder.products}
                renderItem={(item) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <p><strong>{item.name}</strong> ({item.quantity} x {item.unit})</p>
                      <p>Price: ₹{item.price.toFixed(2)} | Total: ₹{item.productTotal.toFixed(2)}</p>
                      <p>GST: {item.gstRate === 'non-gst' ? 'Non-GST' : `₹${item.productGST.toFixed(2)} (${item.gstRate}%)`}</p>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export async function getServerSideProps(context) {
  const { params } = context;
  const { branchId } = params;

  return {
    props: {
      branchId,
    },
  };
}


OrderListPage.useLayout = false;
export default OrderListPage;