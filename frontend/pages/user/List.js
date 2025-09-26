import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Input as AntInput, Popconfirm, Space } from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const { Option } = Select;

const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(true); // ✅ Default to Active (true)
  const router = useRouter();
  const [form] = Form.useForm();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      fetchUsers(token);
      fetchBranches(token);
    }
  }, [router]);

  const fetchUsers = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
        filterUsers(searchText, roleFilter, statusFilter, data); // Apply filters on load
      } else {
        message.error('Failed to fetch users');
      }
    } catch (error) {
      message.error('Error fetching users');
    }
    setLoading(false);
  };

  const fetchBranches = async (token) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/branches`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setBranches(data);
      else message.error('Failed to fetch branches');
    } catch (error) {
      message.error('Error fetching branches');
    }
  };

  const filterUsers = (search, role, status, userList = users) => {
    let filtered = [...userList];
    // Apply active filter by default if status is unset
    filtered = filtered.filter(user => status === null ? user.isActive : user.isActive === status);
    if (search) {
      filtered = filtered.filter(user => user.username.toLowerCase().includes(search.toLowerCase()));
    }
    if (role) {
      filtered = filtered.filter(user => user.role === role);
    }
    setFilteredUsers(filtered);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
    filterUsers(value, roleFilter, statusFilter);
  };

  const handleRoleFilter = (value) => {
    setRoleFilter(value);
    filterUsers(searchText, value, statusFilter);
  };

  const handleStatusFilter = (value) => {
    const status = value === 'true' ? true : value === 'false' ? false : null; // Convert to boolean/null
    setStatusFilter(status);
    filterUsers(searchText, roleFilter, status);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    form.setFieldsValue({
      password: '',
      role: user.role,
      branchId: user.branchId ? user.branchId._id : null,
    });
    setEditVisible(true);
  };

  const handleToggleStatus = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/users/${userId}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        message.success(data.message);
        fetchUsers(token);
      } else {
        message.error(data.message || 'Failed to toggle status');
      }
    } catch (error) {
      message.error('Server error');
    }
  };

  const handleDelete = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        message.success('User deleted successfully');
        fetchUsers(token);
      } else {
        message.error(data.message || 'Failed to delete user');
      }
    } catch (error) {
      message.error('Server error');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        message.success('User updated successfully');
        setEditVisible(false);
        fetchUsers(token);
      } else {
        message.error(data.message || 'Failed to update user');
      }
    } catch (error) {
      message.error('Server error');
    }
    setLoading(false);
  };

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
      title: 'Branch',
      dataIndex: 'branchId',
      key: 'branchId',
      render: (branchId) => (branchId ? branchId.name : 'N/A'),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (isActive ? 'Active' : 'Inactive'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure to delete this user?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger>Delete</Button>
          </Popconfirm>
          <Button
            icon={record.isActive ? <CloseOutlined /> : <CheckOutlined />}
            onClick={() => handleToggleStatus(record._id)}
          >
            {record.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h2>User List</h2>
      <Space style={{ marginBottom: '10px' }}>
        <AntInput
          placeholder="Search by username"
          value={searchText}
          onChange={handleSearch}
          style={{ width: '200px' }}
        />
        <Select
          placeholder="Filter by role"
          value={roleFilter}
          onChange={handleRoleFilter}
          allowClear
          style={{ width: '150px' }}
        >
          <Option value="superadmin">Superadmin</Option>
          <Option value="admin">Admin</Option>
          <Option value="branch">Branch</Option>
          <Option value="accounts">Accounts</Option>
        </Select>
        <Select
          placeholder="Filter by status"
          value={statusFilter === null ? null : statusFilter.toString()}
          onChange={handleStatusFilter}
          allowClear
          style={{ width: '150px' }}
        >
          <Option value="true">Active</Option>
          <Option value="false">Inactive</Option>
        </Select>
      </Space>
      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Edit User"
        visible={editVisible}
        onCancel={() => setEditVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item label="Username">
            <span>{selectedUser?.username}</span>
          </Form.Item>
          <Form.Item
            label="Password (leave blank to keep unchanged)"
            name="password"
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: 'Please select a role!' }]}
          >
            <Select>
              <Option value="superadmin">Superadmin</Option>
              <Option value="admin">Admin</Option>
              <Option value="branch">Branch</Option>
              <Option value="accounts">Accounts</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Branch"
            name="branchId"
            rules={[{ required: form.getFieldValue('role') === 'branch', message: 'Please select a branch!' }]}
          >
            <Select
              placeholder="Select a branch"
              disabled={form.getFieldValue('role') !== 'branch'}
              allowClear
            >
              {branches.map(branch => (
                <Option key={branch._id} value={branch._id}>{branch.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserListPage;