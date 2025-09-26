import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const BranchListPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const router = useRouter();
  const [form] = Form.useForm();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      fetchBranches(token);
    }
  }, [router]);

  const fetchBranches = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/branches`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('Fetched branches:', data); // ✅ Debug log
      if (response.ok) {
        setBranches(data);
        if (data.length === 0) message.info('No branches found. Add some via "Add Branch".');
      } else {
        message.error(data.message || 'Failed to fetch branches');
      }
    } catch (error) {
      message.error('Error fetching branches');
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

  const handleEdit = (branch) => {
    setSelectedBranch(branch);
    form.setFieldsValue(branch);
    setEditVisible(true);
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/branches/${selectedBranch._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        message.success('Branch updated successfully');
        setEditVisible(false);
        fetchBranches(token);
      } else {
        message.error(data.message || 'Failed to update branch');
      }
    } catch (error) {
      message.error('Server error');
    }
    setLoading(false);
  };

  const columns = [
    { title: 'Branch ID', dataIndex: 'branchId', key: 'branchId' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Address', dataIndex: 'address', key: 'address' },
    { title: 'Phone No', dataIndex: 'phoneNo', key: 'phoneNo' },
    { title: 'Email ID', dataIndex: 'emailId', key: 'emailId' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h2>Branch List</h2>
      <Button type="primary" style={{ marginBottom: '20px' }} onClick={() => router.push('/branches/add')}>
        Add Branch
      </Button>
      <Table
        columns={columns}
        dataSource={branches}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title={`Edit Branch - ${selectedBranch?.name}`}
        visible={editVisible}
        onCancel={() => setEditVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            label="Branch ID"
            name="branchId"
            rules={[{ required: true, message: 'Please enter a branch ID!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Branch Name"
            name="name"
            rules={[{ required: true, message: 'Please enter a branch name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: 'Please enter an address!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Phone Number"
            name="phoneNo"
            rules={[{ required: true, message: 'Please enter a phone number!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Email ID"
            name="emailId"
            rules={[{ required: true, message: 'Please enter an email ID!' }, { type: 'email', message: 'Invalid email!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Branch
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BranchListPage;