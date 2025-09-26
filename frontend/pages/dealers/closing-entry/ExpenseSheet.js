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
  Input,
  Table,
  Layout,
} from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import BranchHeader from '../../../components/BranchHeader';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Option } = Select;
const { Text, Title } = Typography;

const ExpenseSheet = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [branchId, setBranchId] = useState(null);
  const [branchName, setBranchName] = useState('');
  const [userName, setUserName] = useState('User');
  const [date, setDate] = useState(dayjs());
  const [expenseDetails, setExpenseDetails] = useState([
    { serialNo: 1, reason: '', recipient: '', amount: '' },
  ]);
  const [existingExpenses, setExistingExpenses] = useState([]);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

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
          setBranchId(branchId);
        } else {
          message.error('Branch not found');
          setBranchName('Unknown Branch');
        }
      } else {
        message.error('Failed to fetch branches');
        setBranchName('Unknown Branch');
      }
    } catch (error) {
      message.error('Error fetching branch details');
      setBranchName('Unknown Branch');
    } finally {
      setLoading(false);
    }
  };

  const fetchClosingEntries = async (branchId, selectedDate) => {
    try {
      const token = localStorage.getItem('token');
      const startOfDay = selectedDate.startOf('day').toDate();
      const endOfDay = selectedDate.endOf('day').toDate();
      const response = await fetch(`${BACKEND_URL}/api/closing-entries`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (response.ok) {
        const branchEntries = result.filter(
          entry => entry.branchId?._id === branchId && dayjs(entry.date).isSame(selectedDate, 'day')
        );
        // Aggregate expenseDetails from all matching entries
        const expenses = branchEntries.reduce((acc, entry) => {
          return [
            ...acc,
            ...entry.expenseDetails.map((detail, index) => ({
              ...detail,
              key: `${entry._id}-${index}-${detail.reason}-${detail.recipient}`,
            })),
          ];
        }, []);
        setExistingExpenses(expenses);
      } else {
        message.error('Failed to fetch closing entries');
        setExistingExpenses([]);
      }
    } catch (err) {
      message.error('Error fetching closing entries');
      setExistingExpenses([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.info('Please log in to access the form');
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      const decoded = jwtDecode(token);
      setUserName(decoded.name || decoded.username || 'User');
      if (decoded.branchId) {
        setBranchId(decoded.branchId);
        fetchBranchDetails(token, decoded.branchId);
        fetchClosingEntries(decoded.branchId, date);
      } else {
        message.error('No branch associated with this user');
        router.push('/login');
      }
    } catch (error) {
      message.error('Invalid token, please log in again');
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (branchId && date) {
      fetchClosingEntries(branchId, date);
    }
  }, [date, branchId]);

  const handleAddExpense = () => {
    setExpenseDetails([...expenseDetails, { serialNo: expenseDetails.length + 1, reason: '', recipient: '', amount: '' }]);
  };

  const handleRemoveExpense = (index) => {
    if (expenseDetails.length === 1) {
      setExpenseDetails([{ serialNo: 1, reason: '', recipient: '', amount: '' }]);
      message.success('Expense entry reset to default.');
      return;
    }
    const updatedDetails = expenseDetails.filter((_, i) => i !== index);
    const reindexedDetails = updatedDetails.map((detail, i) => ({
      ...detail,
      serialNo: i + 1,
    }));
    setExpenseDetails(reindexedDetails);
    message.success('Expense entry removed successfully.');
  };

  const handleReasonChange = (index, value) => {
    const updatedDetails = [...expenseDetails];
    updatedDetails[index].reason = value || '';
    setExpenseDetails(updatedDetails);
  };

  const handleRecipientChange = (index, value) => {
    const updatedDetails = [...expenseDetails];
    updatedDetails[index].recipient = value;
    setExpenseDetails(updatedDetails);
  };

  const handleAmountChange = (index, value) => {
    const updatedDetails = [...expenseDetails];
    updatedDetails[index].amount = value || '';
    setExpenseDetails(updatedDetails);
  };

  const handleSubmit = async () => {
    if (!branchId) {
      message.error('Branch is required');
      return;
    }
    if (!date) {
      message.error('Please select a date');
      return;
    }
    for (const detail of expenseDetails) {
      if (Number(detail.amount) > 0 && (!detail.reason || !detail.recipient)) {
        message.error('Please select a reason and enter a recipient for all expense amounts');
        return;
      }
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/closing-entries/expense-sheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          branchId,
          date: date.format('YYYY-MM-DD'),
          expenseDetails,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        message.success('Expense sheet submitted successfully');
        fetchClosingEntries(branchId, date);
        handleClearForm();
      } else {
        message.error(result.message || 'Failed to submit expense sheet');
      }
    } catch (err) {
      message.error('Server error while submitting expense sheet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearForm = () => {
    setExpenseDetails([{ serialNo: 1, reason: '', recipient: '', amount: '' }]);
    message.success('Form cleared successfully');
  };

  const expenseColumns = [
    {
      title: 'Serial No',
      dataIndex: 'serialNo',
      key: 'serialNo',
      width: 80,
      align: 'center',
      render: (text) => <Input value={text} disabled style={{ textAlign: 'center' }} />,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 250,
      render: (text, record, index) => (
        <Select
          value={text}
          onChange={(value) => handleReasonChange(index, value)}
          placeholder="Select reason"
          style={{ width: '100%' }}
          size="large"
          allowClear
        >
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
      ),
    },
    {
      title: 'Recipient/Reason',
      dataIndex: 'recipient',
      key: 'recipient',
      width: 250,
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => handleRecipientChange(index, e.target.value)}
          placeholder="Enter recipient or reason (e.g., John Doe)"
          size="large"
        />
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 200,
      align: 'center',
      render: (text, record, index) => (
        <InputNumber
          value={text}
          onChange={(value) => handleAmountChange(index, value)}
          max={999999}
          style={{ width: '100%' }}
          size="large"
          controls={false}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 60,
      align: 'center',
      render: (text, record, index) => (
        <Button
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveExpense(index)}
          style={{ color: '#ff4d4f' }}
          size="small"
        />
      ),
    },
  ];

  const existingExpenseColumns = [
    {
      title: 'Serial No',
      dataIndex: 'serialNo',
      key: 'serialNo',
      width: 80,
      align: 'center',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 250,
    },
    {
      title: 'Recipient/Reason',
      dataIndex: 'recipient',
      key: 'recipient',
      width: 250,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 200,
      align: 'center',
      render: (value) => `₹${value || 0}`,
    },
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
            Expense Sheet
          </Title>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              <Card
                title={<Title level={4} style={{ margin: 0, color: '#34495e' }}>Add Expense</Title>}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  background: '#fff',
                  transition: 'all 0.3s ease',
                  marginBottom: '20px',
                }}
                hoverable
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '150px 1fr',
                    gap: '15px',
                    alignItems: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <Text strong>Date:</Text>
                  <DatePicker
                    value={date}
                    onChange={(value) => setDate(value)}
                    format="YYYY-MM-DD"
                    style={{ width: '100%', height: '40px' }}
                    size="large"
                  />
                </div>
                <Table
                  columns={expenseColumns}
                  dataSource={expenseDetails}
                  pagination={false}
                  bordered
                  rowKey={(record, index) => index}
                  style={{ marginBottom: '10px' }}
                />
                <Button
                  icon={<PlusOutlined />}
                  onClick={handleAddExpense}
                  style={{
                    background: '#e6f7ff',
                    borderColor: '#91d5ff',
                    color: '#1890ff',
                    borderRadius: '4px',
                    marginTop: '10px',
                    display: 'block',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                >
                  Add Expense
                </Button>
                <Space
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '20px',
                  }}
                >
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSubmit}
                    loading={submitting}
                    size="large"
                    style={{
                      width: '150px',
                      background: 'linear-gradient(to right, #34495e, #1a3042)',
                      borderColor: '#34495e',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Submit
                  </Button>
                </Space>
              </Card>

              <Card
                title={<Title level={4} style={{ margin: 0, color: '#34495e' }}>Expense Entries</Title>}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  background: '#fff',
                  marginTop: '20px',
                }}
              >
                {existingExpenses.length === 0 ? (
                  <Text style={{ display: 'block', textAlign: 'center', padding: '20px' }}>
                    No expense entries found for the selected date.
                  </Text>
                ) : (
                  <Table
                    columns={existingExpenseColumns}
                    dataSource={existingExpenses}
                    pagination={{ pageSize: 5 }}
                    bordered
                    rowKey="key"
                  />
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

ExpenseSheet.useLayout = false;
export default ExpenseSheet;