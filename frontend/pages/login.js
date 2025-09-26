import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useRouter } from 'next/router';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token); // Store JWT
        switch (data.role) {
          case 'branch':
            router.push(`/branch/${data.branchId}`);
            break;
          case 'superadmin':
            router.push('/dashboard');
            break;
          case 'admin':
            router.push('/dashboard');
            break;
          case 'accounts':
            router.push('/branch/account');
            break;
          case 'deliveryboy':
            router.push(`/delivery/${data.deliveryboyId || data._id}`); // Fallback to _id if deliveryboyId isn't present
            break;
          default:
            message.error('Unknown role');
        }
      } else {
        message.error(data.message || 'Login failed');
      }
    } catch (error) {
      message.error('Server error');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center' }}>Login</h2>
      <Form name="login" onFinish={onFinish} layout="vertical">
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: 'Please enter your username!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please enter your password!' }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

LoginPage.useLayout = false;
export default LoginPage;