import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, message, Row, Col } from 'antd';
import { useRouter } from 'next/router';

const CompanyForm = () => {
  const [form] = Form.useForm();
  const [companies, setCompanies] = useState([]);
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/companies`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setCompanies(Array.isArray(data) ? data.sort((a, b) => a.name.localeCompare(b.name)) : []);
      } else {
        message.error('Failed to fetch companies');
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      message.error('Error fetching companies');
      setCompanies([]);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const onFinish = async (values) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: values.name }),
      });

      const responseData = await response.json();
      if (response.ok) {
        message.success('✅ Company created successfully!');
        form.resetFields();
        fetchCompanies(); // Refresh the company list
      } else {
        message.error(`❌ Error: ${responseData.message || 'Failed to create company'}`);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      message.error('❌ Unable to reach the server.');
    }
  };

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'serialNo',
      key: 'serialNo',
      render: (_, __, index) => index + 1,
      width: 100,
    },
    {
      title: 'Company Name',
      dataIndex: 'name',
      key: 'name',
    },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: '15px' }}>Manage Companies</h2>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={8} align="middle">
          <Col span={20}>
            <Form.Item
              label="Company Name"
              name="name"
              rules={[
                { required: true, message: 'Please enter company name!' },
                { max: 50, message: 'Company name cannot exceed 50 characters!' },
                { pattern: /^[A-Za-z\s]+$/, message: 'Only letters and spaces are allowed!' },
              ]}
              style={{ marginBottom: '15px' }}
            >
              <Input placeholder="Enter company name (e.g., Cadbury)" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item style={{ marginBottom: '15px', marginTop: '30px' }}>
              <Button type="primary" htmlType="submit" block>
                Create
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <Table
        columns={columns}
        dataSource={companies}
        rowKey="_id"
        locale={{ emptyText: 'No companies available' }}
        pagination={false}
        bordered
        style={{ marginTop: '15px' }}
      />
    </div>
  );
};

export default CompanyForm;