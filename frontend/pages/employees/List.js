import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Upload, message, Popconfirm, Space, Image, Input as AntInput } from 'antd';
import { EditOutlined, DeleteOutlined, UploadOutlined, SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const { Option } = Select;

const EmployeeListPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [fileListAadhaar, setFileListAadhaar] = useState([]);
  const [fileListPhoto, setFileListPhoto] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState(''); // For search bar
  const [selectedTeam, setSelectedTeam] = useState(null); // Team filter
  const [selectedStatus, setSelectedStatus] = useState('Active'); // Default to "Active"
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.info('Please log in as Superadmin or Admin');
      router.push('/login');
    } else {
      fetchEmployees(token);
    }
  }, [router]);

  const fetchEmployees = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/employees`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setEmployees(Array.isArray(data) ? data : []);
      else message.error('Failed to fetch employees');
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Error fetching employees');
    }
    setLoading(false);
  };

  const filterEmployees = (employeesList, search, team, status) => {
    let filtered = [...employeesList];

    if (search) {
      filtered = filtered.filter(employee =>
        employee.name.toLowerCase().includes(search.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (team !== null && team !== undefined) {
      filtered = filtered.filter(employee => employee.team === team);
    }

    if (status !== null && status !== undefined) {
      filtered = filtered.filter(employee => employee.status === status);
    } else {
      // Default to Active if no status filter is selected
      filtered = filtered.filter(employee => employee.status === 'Active');
    }

    return filtered;
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleTeamFilter = (value) => {
    setSelectedTeam(value);
  };

  const handleStatusFilter = (value) => {
    setSelectedStatus(value === undefined || value === null ? 'Active' : value); // Default to Active if cleared
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    form.setFieldsValue({
      name: employee.name,
      phoneNumber: employee.phoneNumber,
      address: employee.address,
      team: employee.team,
      status: employee.status,
    });
    setFileListAadhaar(employee.aadhaar ? [{
      uid: '-1',
      name: employee.aadhaar.split('/').pop(),
      status: 'done',
      url: `${BACKEND_URL}/${employee.aadhaar}`,
    }] : []);
    setFileListPhoto(employee.photo ? [{
      uid: '-2',
      name: employee.photo.split('/').pop(),
      status: 'done',
      url: `${BACKEND_URL}/${employee.photo}`,
    }] : []);
    setPreviewImage(employee.photo ? `${BACKEND_URL}/${employee.photo}` : null);
    setEditVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        message.success('Employee deleted successfully');
        fetchEmployees(token);
      } else {
        message.error(data.message || 'Failed to delete employee');
      }
    } catch (error) {
      message.error('Server error');
    }
  };

  const handleStatusToggle = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/employees/${id}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        message.success(data.message);
        fetchEmployees(token);
      } else {
        message.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      message.error('Server error');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('phoneNumber', values.phoneNumber);
    formData.append('address', values.address);
    formData.append('team', values.team);
    formData.append('status', values.status);

    if (fileListAadhaar.length > 0 && fileListAadhaar[0].originFileObj) {
      formData.append('aadhaar', fileListAadhaar[0].originFileObj);
    }
    if (fileListPhoto.length > 0 && fileListPhoto[0].originFileObj) {
      formData.append('photo', fileListPhoto[0].originFileObj);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/employees/${selectedEmployee._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        message.success('Employee updated successfully');
        setEditVisible(false);
        fetchEmployees(token);
      } else {
        message.error(data.message || 'Failed to update employee');
      }
    } catch (error) {
      message.error('Server error');
    }
    setLoading(false);
  };

  const handleAadhaarUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileListAadhaar([{ ...file, originFileObj: file }]);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handlePhotoUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileListPhoto([{ ...file, originFileObj: file }]);
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const aadhaarUploadProps = {
    beforeUpload: handleAadhaarUpload,
    onRemove: () => setFileListAadhaar([]),
    fileList: fileListAadhaar,
    showUploadList: false,
    maxCount: 1,
    accept: 'image/jpeg,image/png,application/pdf',
  };

  const photoUploadProps = {
    beforeUpload: handlePhotoUpload,
    onRemove: () => {
      setFileListPhoto([]);
      setPreviewImage(null);
    },
    fileList: fileListPhoto,
    showUploadList: false,
    maxCount: 1,
    accept: 'image/jpeg,image/png',
  };

  const filteredEmployees = filterEmployees(employees, searchText, selectedTeam, selectedStatus);

  const columns = [
    { title: 'Employee ID', dataIndex: 'employeeId', key: 'employeeId', width: 120 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Phone Number', dataIndex: 'phoneNumber', key: 'phoneNumber', width: 120 },
    { title: 'Team', dataIndex: 'team', key: 'team' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Photo',
      dataIndex: 'photo',
      key: 'photo',
      render: (photo) => photo ? (
        <Image src={`${BACKEND_URL}/${photo}`} alt="Employee Photo" style={{ maxWidth: '50px', maxHeight: '50px' }} />
      ) : 'No Photo',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure you want to delete this employee?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
          <Button
            icon={record.status === 'Active' ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleStatusToggle(record._id)}
            style={{ color: record.status === 'Active' ? '#ff4d4f' : '#52c41a' }}
          >
            {record.status === 'Active' ? 'Deactivate' : 'Activate'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>Employee List</h2>
        <Button type="primary" onClick={() => router.push('/employees/add')}>
          Create Employee
        </Button>
      </div>

      {/* Filters & Search */}
      <Space wrap style={{ marginBottom: '10px' }}>
        <AntInput
          placeholder="Search by ID or Name"
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: '200px' }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="Team"
          onChange={handleTeamFilter}
          allowClear
          style={{ width: '150px' }}
          value={selectedTeam}
        >
          <Option value="Waiter">Waiter</Option>
          <Option value="Chef">Chef</Option>
          <Option value="Cashier">Cashier</Option>
          <Option value="Manager">Manager</Option>
        </Select>
        <Select
          placeholder="Status"
          onChange={handleStatusFilter}
          allowClear
          style={{ width: '150px' }}
          value={selectedStatus}
        >
          <Option value="Active">Active</Option>
          <Option value="Inactive">Inactive</Option>
        </Select>
        <Button onClick={() => { setSearchText(''); setSelectedTeam(null); setSelectedStatus('Active'); }}>Clear Filters</Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredEmployees}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Edit Employee"
        visible={editVisible}
        onCancel={() => setEditVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter employee name!' }]}
          >
            <Input placeholder="e.g., John Doe" />
          </Form.Item>
          <Form.Item
            label="Phone Number"
            name="phoneNumber"
            rules={[{ required: true, message: 'Please enter phone number!' }]}
          >
            <Input placeholder="e.g., 919876543210" />
          </Form.Item>
          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: 'Please enter address!' }]}
          >
            <Input.TextArea placeholder="e.g., 123 Bakery Street" rows={3} />
          </Form.Item>
          <Form.Item
            label="Team"
            name="team"
            rules={[{ required: true, message: 'Please select team!' }]}
          >
            <Select placeholder="Select team">
              <Option value="Waiter">Waiter</Option>
              <Option value="Chef">Chef</Option>
              <Option value="Cashier">Cashier</Option>
              <Option value="Manager">Manager</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select status!' }]}
          >
            <Select placeholder="Select status">
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Aadhaar Card (Optional)">
            <Upload {...aadhaarUploadProps}>
              <Button icon={<UploadOutlined />}>Upload Aadhaar (JPG/PNG/PDF)</Button>
            </Upload>
            {fileListAadhaar.length > 0 && (
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <img src={fileListAadhaar[0].url} alt="Aadhaar Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                <br />
                <Button type="link" onClick={() => setFileListAadhaar([])} style={{ marginTop: '5px' }}>
                  Remove
                </Button>
              </div>
            )}
          </Form.Item>
          <Form.Item label="Photo">
            <Upload {...photoUploadProps}>
              <Button icon={<UploadOutlined />}>Upload Photo (JPG/PNG)</Button>
            </Upload>
            {previewImage && (
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <img src={previewImage} alt="Photo Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                <br />
                <Button type="link" onClick={() => { setFileListPhoto([]); setPreviewImage(null); }} style={{ marginTop: '5px' }}>
                  Remove
                </Button>
              </div>
            )}
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

export default EmployeeListPage;