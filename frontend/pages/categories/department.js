import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, Space, Popconfirm, Row, Col, message } from 'antd';
import { DeleteOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const DepartmentManagementPage = () => {
  const [form] = Form.useForm();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState({});
  const [editingId, setEditingId] = useState(null); // New: Track if editing
  const [isEditing, setIsEditing] = useState(false); // New: Mode flag
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.info('Please log in as Superadmin');
      router.push('/login');
    } else {
      fetchDepartments(token);
    }
  }, [router]);

  const fetchDepartments = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/departments/list-departments`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setDepartments(data);
      } else {
        message.error('Failed to fetch departments');
      }
    } catch (error) {
      message.error('Error fetching departments');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    const requestBody = { name: values.name };

    try {
      const token = localStorage.getItem('token');
      let url = `${BACKEND_URL}/api/departments`;
      let method = 'POST';

      if (isEditing && editingId) {
        url = `${BACKEND_URL}/api/departments/${editingId}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (response.ok) {
        message.success(isEditing ? 'Department updated successfully' : 'Department created successfully');
        form.resetFields();
        setEditingId(null);
        setIsEditing(false);
        fetchDepartments(token); // Refresh list
      } else {
        message.error(data.message || `Failed to ${isEditing ? 'update' : 'create'} department`);
      }
    } catch (error) {
      console.error('Frontend error:', error); // Debug log
      message.error('Server error');
    }
    setLoading(false);
  };

  // New: Handle edit click - fetch and pre-fill form
  const handleEdit = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/departments/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        form.setFieldsValue({ name: data.name });
        setEditingId(id);
        setIsEditing(true);
        message.info('Edit mode activated - update the name and save');
      } else {
        message.error('Failed to fetch department for edit');
      }
    } catch (error) {
      console.error('Edit fetch error:', error);
      message.error('Error loading department for edit');
    }
  };

  const handleDelete = async (id, token) => {
    setLoadingDelete(prev => ({ ...prev, [id]: true }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        message.success('Department deleted successfully');
        fetchDepartments(token); // Refresh list
      } else {
        message.error(data.message || 'Failed to delete department');
      }
    } catch (error) {
      console.error('Delete error:', error); // Debug log
      message.error('Server error');
    }
    setLoadingDelete(prev => ({ ...prev, [id]: false }));
  };

  // New: Cancel edit
  const handleCancelEdit = () => {
    form.resetFields();
    setEditingId(null);
    setIsEditing(false);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record._id)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this department?"
            onConfirm={() => {
              const token = localStorage.getItem('token');
              handleDelete(record._id, token);
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
              loading={loadingDelete[record._id]}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', background: '#fff', minHeight: '100vh' }}>
      <Row gutter={16}>
        <Col span={12}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
            {isEditing ? 'Edit Department' : 'Create Department'}
          </h2>
          <Form form={form} onFinish={onFinish} layout="vertical">
            <Form.Item
              label="Department Name"
              name="name"
              rules={[{ required: true, message: 'Please enter a department name!' }]}
            >
              <Input placeholder="e.g., Bakery" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading} icon={isEditing ? <SaveOutlined /> : undefined}>
                  {isEditing ? 'Update' : 'Create'} Department
                </Button>
                {isEditing && (
                  <Button onClick={handleCancelEdit} loading={loading}>
                    Cancel
                  </Button>
                )}
              </Space>
            </Form.Item>
          </Form>
        </Col>
        <Col span={12}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Departments List</h2>
          <Table
            dataSource={departments}
            columns={columns}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default DepartmentManagementPage;