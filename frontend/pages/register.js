import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import { useRouter } from 'next/router';

const { Option } = Select;

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null); // ✅ Track role state
  const router = useRouter();
  const [form] = Form.useForm();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.info('Please log in as Superadmin to register users');
      router.push('/login');
    } else {
      fetchBranches(token);
    }
  }, [router]);

  const fetchBranches = async (token) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/branches`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setBranches(data);
        console.log('Branches fetched:', data); // ✅ Debug log
      } else {
        message.error('Failed to fetch branches');
      }
    } catch (error) {
      message.error('Error fetching branches');
      console.error('Fetch error:', error);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        message.success('User created successfully');
        form.resetFields();
      } else {
        message.error(data.message || 'Failed to create user');
        if (response.status === 403) {
          localStorage.removeItem('token');
          router.push('/login');
        }
      }
    } catch (error) {
      message.error('Error: ' + error.message);
      router.push('/login');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center' }}>Register User</h2>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: 'Please enter a username!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please enter a password!' }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: 'Please select a role!' }]}
        >
          <Select onChange={(value) => setSelectedRole(value)}>
            <Option value="superadmin">Superadmin</Option>
            <Option value="admin">Admin</Option>
            <Option value="branch">Branch</Option>
            <Option value="accounts">Accounts</Option>
            <Option value="deliveryboy">Delivery Boy</Option>
          </Select>
        </Form.Item>
        <Form.Item
          label="Branch"
          name="branchId"
          rules={[{ required: selectedRole === 'branch', message: 'Please select a branch!' }]}
        >
          <Select
            placeholder="Select a branch"
            disabled={selectedRole !== 'branch'}
            allowClear
          >
            {branches.map(branch => (
              <Option key={branch._id} value={branch._id}>{branch.name}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Register
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RegisterPage;