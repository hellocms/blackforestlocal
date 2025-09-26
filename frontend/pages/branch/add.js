import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useRouter } from 'next/router';

const AddBranchPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [form] = Form.useForm();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
  }, [router]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        message.success('Branch created successfully');
        form.resetFields();
      } else {
        message.error(data.message || 'Failed to create branch');
      }
    } catch (error) {
      message.error('Server error');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center' }}>Add Branch</h2>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          label="Branch ID"
          name="branchId"
          rules={[{ required: true, message: 'Please enter a branch ID!' }]}
        >
          <Input placeholder="e.g., B001" />
        </Form.Item>
        <Form.Item
          label="Branch Name"
          name="name"
          rules={[{ required: true, message: 'Please enter a branch name!' }]}
        >
          <Input placeholder="e.g., Branch 1" />
        </Form.Item>
        <Form.Item
          label="Address"
          name="address"
          rules={[{ required: true, message: 'Please enter an address!' }]}
        >
          <Input placeholder="e.g., 123 Main St" />
        </Form.Item>
        <Form.Item
          label="Phone Number"
          name="phoneNo"
          rules={[{ required: true, message: 'Please enter a phone number!' }]}
        >
          <Input placeholder="e.g., 555-1234" />
        </Form.Item>
        <Form.Item
          label="Email ID"
          name="emailId"
          rules={[{ required: true, message: 'Please enter an email ID!' }, { type: 'email', message: 'Invalid email!' }]}
        >
          <Input placeholder="e.g., branch1@example.com" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Add Branch
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddBranchPage;