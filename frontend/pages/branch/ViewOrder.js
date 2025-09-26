import React, { useState, useEffect } from 'react';
import {
  Select,
  DatePicker,
  InputNumber,
  Button,
  message,
  Spin,
  Typography,
  Space,
  Card,
  Table,
  Layout,
  Radio,
} from 'antd';
import { EyeOutlined, EditOutlined, PrinterOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import moment from 'moment';
import BranchHeader from '../../components/BranchHeader';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const ViewOrder = ({ branchId }) => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [branchName, setBranchName] = useState('Unknown Branch');
  const [userName, setUserName] = useState('Branch User');
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState([]);
  const [orderListTab, setOrderListTab] = useState('stock');
  const [editingOrder, setEditingOrder] = useState(null);
  const [todayAssignment, setTodayAssignment] = useState({});
  const [effectiveBranchId, setEffectiveBranchId] = useState(branchId);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  // Fetch branch details
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
          console.warn('Branch not found for ID:', branchId);
          setBranchName('Unknown Branch');
        }
      } else {
        console.error('Failed to fetch branches, status:', response.status);
      }
    } catch (error) {
      console.error('Fetch branches error:', error);
    }
  };

  // Fetch today's assignment (for print)
  const fetchTodayAssignment = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/daily-assignments/${effectiveBranchId}/today`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setTodayAssignment(data);
      } else {
        console.error('Failed to fetch assignment, status:', response.status);
      }
    } catch (error) {
      console.error('Fetch assignment error:', error);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    if (!token || !effectiveBranchId) {
      console.warn('Skipping fetchOrders: Missing token or branchId');
      return;
    }
    setOrderLoading(true);
    try {
      let url = `${BACKEND_URL}/api/orders`;
      const queryParams = [];
      if (effectiveBranchId) {
        queryParams.push(`branchId=${effectiveBranchId}`);
      }
      if (orderListTab) {
        queryParams.push(`tab=${orderListTab}`);
      }
      if (statusFilter) {
        queryParams.push(`status=${statusFilter}`);
      }
      if (dateFilter.length === 2) {
        const [start, end] = dateFilter;
        queryParams.push(`startDate=${start.format('YYYY-MM-DD')}&endDate=${end.format('YYYY-MM-DD')}`);
      }
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      console.log('Fetching orders with URL:', url);
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      console.log('Response status:', response.status, 'OK:', response.ok);
      const data = await response.json();
      console.log('Response data:', data);
      if (response.ok || Array.isArray(data)) {
        setOrders(data);
      } else {
        message.error(data.message || 'Failed to fetch orders');
        setOrders([]);
      }
    } catch (error) {
      message.error('Error fetching orders');
      console.error('Fetch orders error:', error);
      setOrders([]);
    }
    setOrderLoading(false);
  };

  // Handle edit order
  const handleEditOrder = (order) => {
    setEditingOrder({ ...order, products: order.products.map(p => ({ ...p })) });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingOrder(null);
  };

  // Handle quantity edit
  const handleQuantityEdit = (index, value) => {
    if (!editingOrder) return;
    const isKg = editingOrder.products[index].unit.toLowerCase().includes('kg');
    let parsedValue = isKg ? parseFloat(value) : parseInt(value, 10);
    
    if (isNaN(parsedValue) || parsedValue <= 0) {
      parsedValue = 0;
    } else if (!isKg && parsedValue !== Math.floor(parsedValue)) {
      parsedValue = Math.floor(parsedValue);
    }

    setEditingOrder(prev => ({
      ...prev,
      products: prev.products.map((p, i) =>
        i === index ? { ...p, quantity: parsedValue } : p
      ),
    }));
  };

  // Handle received qty edit
  const handleReceivedQtyEdit = (index, value) => {
    if (!editingOrder) return;
    const isKg = editingOrder.products[index].unit.toLowerCase().includes('kg');
    let parsedValue = isKg ? parseFloat(value) : parseInt(value, 10);

    if (isNaN(parsedValue) || parsedValue < 0) {
      parsedValue = 0;
    } else if (!isKg && parsedValue !== Math.floor(parsedValue)) {
      parsedValue = Math.floor(parsedValue);
    }

    // Optional: Cap receivedQty at sendingQty
    const sendingQty = editingOrder.products[index].sendingQty || 0;
    if (parsedValue > sendingQty) {
      message.warning(`Received Qty cannot exceed Sending Qty (${sendingQty})`);
      parsedValue = sendingQty;
    }

    setEditingOrder(prev => ({
      ...prev,
      products: prev.products.map((p, i) =>
        i === index ? { ...p, receivedQty: parsedValue } : p
      ),
    }));
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    const products = editingOrder.products.filter(p => p.quantity > 0).map(p => ({
      productId: p.productId,
      name: p.name,
      quantity: p.quantity,
      sendingQty: p.sendingQty || 0,
      receivedQty: p.receivedQty || 0,
      price: p.price,
      unit: p.unit,
      gstRate: p.gstRate,
      productTotal: p.quantity * p.price,
      productGST: p.gstRate === "non-gst" ? 0 : (p.quantity * p.price * p.gstRate) / 100,
      bminstock: p.bminstock || 0,
      confirmed: p.confirmed || false,
    }));
    if (products.length === 0) {
      message.warning('At least one product must have a positive quantity');
      return;
    }

    console.log('PATCH body products[0]:', products[0]);

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${editingOrder._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ products }),
      });
      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(prev =>
          prev.map(o => (o._id === editingOrder._id ? updatedOrder.order : o))
        );
        setEditingOrder(null);
        message.success('Order updated successfully');
      } else {
        const data = await response.json();
        message.error(data.message || 'Failed to update order');
      }
    } catch (error) {
      message.error('Error updating order');
      console.error('Save error:', error);
    }
  };

  // Initialize
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip during SSR

    const storedToken = localStorage.getItem('token');
    console.log('Stored token:', storedToken); // Debug
    if (!storedToken) {
      message.info('Please log in to access orders');
      router.replace('/login');
      return;
    }

    setToken(storedToken);

    try {
      const decoded = jwtDecode(storedToken);
      console.log('Decoded token:', decoded); // Debug
      if (!['branch', 'admin', 'superadmin'].includes(decoded.role)) {
        console.warn('Invalid role:', decoded.role);
        message.error('Unauthorized role, please log in with a valid account');
        router.replace('/login');
        return;
      }
      setUserName(decoded.name || decoded.username || 'Branch User');
      const newBranchId = branchId || decoded.branchId;
      if (!newBranchId) {
        console.warn('No branchId in token or props');
        message.error('No branch associated with this user');
        router.replace('/login');
        return;
      }
      setEffectiveBranchId(newBranchId);
      fetchBranchDetails(storedToken, newBranchId);
      fetchTodayAssignment(storedToken);
    } catch (error) {
      console.error('Error decoding token:', error.message, error); // Detailed log
      message.error('Invalid token, please log in again');
      router.replace('/login');
    }
  }, [router, branchId]);

  // Refetch orders when token or filters change
  useEffect(() => {
    if (token && effectiveBranchId) {
      fetchOrders();
    }
  }, [orderListTab, statusFilter, dateFilter, token, effectiveBranchId]);

  // Order list table columns
  const orderColumns = [
    {
      title: 'Bill No',
      dataIndex: 'billNo',
      key: 'billNo',
      width: 100,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => moment(date).format('DD-MM-YYYY HH:mm'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => status.charAt(0).toUpperCase() + status.slice(1),
    },
    {
      title: 'Total',
      dataIndex: 'totalWithGST',
      key: 'totalWithGST',
      width: 100,
      render: (total) => `₹${total.toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          {/* Removed View redirect for now; re-enable if single-order page needed */}
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditOrder(record)}
            disabled={!['draft', 'neworder', 'pending'].includes(record.status)}
          >
            Edit
          </Button>
          {record.status === 'completed' && (
            <Button
              type="link"
              icon={<PrinterOutlined />}
              onClick={() => handlePrintOrder(record)}
            >
              Print
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Edit columns
  const editColumns = [
    { title: 'Item', dataIndex: 'name', key: 'name' },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity, record, index) => (
        <InputNumber
          min={0}
          value={quantity}
          onChange={(value) => handleQuantityEdit(index, value)}
          step={record.unit.toLowerCase().includes('kg') ? 0.1 : 1}
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: 'Sending Qty',
      dataIndex: 'sendingQty',
      key: 'sendingQty',
      render: (sendingQty, record) => (
        <span
          style={{
            color: sendingQty > 0 ? '#52c41a' : '#d9d9d9',
            fontWeight: sendingQty > 0 ? 'bold' : 'normal',
            display: 'inline-block',
            minWidth: '70px',
            textAlign: 'center',
          }}
          title={sendingQty === undefined || sendingQty === 0 ? 'No sending qty assigned' : `Sending: ${sendingQty}${record.unit || ''}`}
        >
          {sendingQty || 0}{record.unit ? ` ${record.unit}` : ''}
        </span>
      ),
    },
    {
      title: 'Received Qty',
      dataIndex: 'receivedQty',
      key: 'receivedQty',
      render: (receivedQty, record, index) => (
        <InputNumber
          min={0}
          value={receivedQty}
          onChange={(value) => handleReceivedQtyEdit(index, value)}
          step={record.unit.toLowerCase().includes('kg') ? 0.1 : 1}
          style={{ width: 80 }}
          placeholder="0"
        />
      ),
    },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', render: (unit) => unit || 'N/A' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (price) => `₹${price.toFixed(2)}` },
    { title: 'Total', dataIndex: 'productTotal', key: 'productTotal', render: (_, record) => `₹${(record.quantity * record.price).toFixed(2)}` },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <BranchHeader />
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
        <div style={{ maxWidth: '1400px', width: '100%' }}>
          <Title
            level={2}
            style={{
              textAlign: 'center',
              marginBottom: '20px',
              color: '#1a3042',
              fontWeight: 'bold',
            }}
          >
            View Orders
          </Title>

          {orderLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size=" personally large" />
            </div>
          ) : (
            <>
              <Card
                title={<Title level={4} style={{ margin: 0, color: '#34495e' }}>Order List</Title>}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  background: '#fff',
                  marginBottom: '20px',
                }}
                hoverable
              >
                <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
                  <Radio.Group
                    value={orderListTab}
                    onChange={(e) => setOrderListTab(e.target.value)}
                    style={{ marginBottom: 16 }}
                  >
                    <Radio.Button value="stock">Stock Orders</Radio.Button>
                    <Radio.Button value="liveOrder">Live Orders</Radio.Button>
                  </Radio.Group>
                  <Space style={{ marginBottom: 16 }}>
                    <Select
                      value={statusFilter}
                      onChange={setStatusFilter}
                      placeholder="Filter by Status"
                      allowClear
                      style={{ width: 200 }}
                    >
                      <Option value="draft">Draft</Option>
                      <Option value="completed">Completed</Option>
                      <Option value="pending">Pending</Option>
                      <Option value="delivered">Delivered</Option>
                      <Option value="received">Received</Option>
                      <Option value="neworder">New Order</Option>
                    </Select>
                    <RangePicker
                      value={dateFilter}
                      onChange={(dates) => setDateFilter(dates || [])}
                      format="DD-MM-YYYY"
                    />
                  </Space>
                  <Table
                    columns={orderColumns}
                    dataSource={orders}
                    loading={orderLoading}
                    rowKey="_id"
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 800 }}
                    bordered
                  />
                </Space>
              </Card>

              {editingOrder && (
                <Card
                  title={<Title level={4} style={{ margin: 0, color: '#34495e' }}>Edit Order: {editingOrder.billNo}</Title>}
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    background: '#fff',
                    marginTop: '20px',
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text><strong>Status:</strong> {editingOrder.status.charAt(0).toUpperCase() + editingOrder.status.slice(1)}</Text>
                    <Table
                      dataSource={editingOrder.products}
                      columns={editColumns}
                      pagination={false}
                      rowKey="_id"
                      bordered
                      scroll={{ x: 1000 }}
                      summary={() => (
                        <Table.Summary.Row>
                          <Table.Summary.Cell>Total</Table.Summary.Cell>
                          <Table.Summary.Cell>{editingOrder.products.reduce((sum, p) => sum + (p.quantity || 0), 0)}</Table.Summary.Cell>
                          <Table.Summary.Cell>{editingOrder.products.reduce((sum, p) => sum + (p.sendingQty || 0), 0)}</Table.Summary.Cell>
                          <Table.Summary.Cell>{editingOrder.products.reduce((sum, p) => sum + (p.receivedQty || 0), 0)}</Table.Summary.Cell>
                          <Table.Summary.Cell>N/A</Table.Summary.Cell>
                          <Table.Summary.Cell>₹{editingOrder.products.reduce((sum, p) => sum + (p.price || 0), 0).toFixed(2)}</Table.Summary.Cell>
                          <Table.Summary.Cell>₹{editingOrder.products.reduce((sum, p) => sum + (p.productTotal || 0), 0).toFixed(2)}</Table.Summary.Cell>
                        </Table.Summary.Row>
                      )}
                    />
                    <Space style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                      <Button
                        onClick={handleCancelEdit}
                        style={{ width: 150 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        onClick={handleSaveEdit}
                        style={{ width: 150 }}
                      >
                        Save
                      </Button>
                    </Space>
                  </Space>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export async function getServerSideProps(context) {
  const { params, query } = context;
  const branchId = params?.branchId || query?.branchId || null;

  return {
    props: {
      branchId,
    },
  };
}

ViewOrder.useLayout = false;
export default ViewOrder;