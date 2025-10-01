import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Upload, message, Popconfirm, Space, Checkbox, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const { Option } = Select;

const CategoryListPage = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all'); // Changed to string for single-select
  const [form] = Form.useForm();
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  // Helper to get image src: use full URL if it's a Blob URL (starts with http), else prefix for legacy local paths
  const getImageSrc = (imagePath) => {
    if (imagePath && imagePath.startsWith('http')) {
      return imagePath; // Direct Blob URL
    }
    return imagePath ? `${BACKEND_URL}/${imagePath}` : null;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.info('Please log in as Superadmin');
      router.push('/login');
    } else {
      fetchCategories(token);
      fetchDepartments(token);
    }
  }, [router]);

  const fetchCategories = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/categories/list-categories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Fetched categories:', data);
        setCategories(data);
        applyFilter(data, departmentFilter, typeFilter);
      } else {
        message.error('Failed to fetch categories');
      }
    } catch (error) {
      message.error('Error fetching categories');
    }
    setLoading(false);
  };

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

  const applyFilter = (data, deptFilter, typeFilterValue) => {
    let filtered = data;

    if (deptFilter !== 'all') {
      filtered = filtered.filter(category => 
        Array.isArray(category.departments) && 
        category.departments.some(dept => dept._id === deptFilter)
      );
    }

    if (typeFilterValue === 'pastry') {
      filtered = filtered.filter(category => category.isPastryProduct);
    } else if (typeFilterValue === 'cake') {
      filtered = filtered.filter(category => category.isCake);
    } else if (typeFilterValue === 'biling') {
      filtered = filtered.filter(category => category.isBiling);
    }

    setFilteredCategories(filtered);
  };

  const handleDepartmentFilterChange = (value) => {
    setDepartmentFilter(value);
    applyFilter(categories, value, typeFilter);
  };

  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
    applyFilter(categories, departmentFilter, value);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    form.setFieldsValue({
      name: category.name,
      parent: category.parent?._id || null,
      departments: Array.isArray(category.departments) ? category.departments.map(dept => dept._id) : [],
      isPastryProduct: category.isPastryProduct || false,
      isCake: category.isCake || false,
      isBiling: category.isBiling || false,
    });
    const imageSrc = getImageSrc(category.image);
    setFileList(category.image ? [{
      uid: '-1',
      name: category.image.split('/').pop(),
      status: 'done',
      url: imageSrc,
    }] : []);
    setPreviewImage(imageSrc);
    setEditVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        message.success('Category deleted successfully');
        fetchCategories(token);
      } else {
        const data = await response.json();
        message.error(data.message || 'Failed to delete category');
      }
    } catch (error) {
      message.error('Server error');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('name', values.name);
    if (values.departments && values.departments.length > 0) {
      formData.append('departments', JSON.stringify(values.departments));
    }
    formData.append('parent', values.parent || 'null');
    formData.append('isPastryProduct', values.isPastryProduct || false);
    formData.append('isCake', values.isCake || false);
    formData.append('isBiling', values.isBiling || false);
    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append('image', fileList[0].originFileObj);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/categories/${selectedCategory._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        message.success('Category updated successfully');
        setEditVisible(false);
        fetchCategories(token);
      } else {
        message.error(data.message || 'Failed to update category');
      }
    } catch (error) {
      message.error('Server error');
    }
    setLoading(false);
  };

  const handleUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
      setFileList([{ ...file, originFileObj: file }]);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const uploadProps = {
    beforeUpload: handleUpload,
    onRemove: () => {
      setFileList([]);
      setPreviewImage(null);
    },
    fileList,
    showUploadList: false,
  };

  const dropdownRender = (menu) => (
    <div style={{ padding: '8px' }}>
      {departments.length > 0 ? (
        departments.map(dept => (
          <div key={dept._id} style={{ marginBottom: '8px' }}>
            <Checkbox
              value={dept._id}
              checked={form.getFieldValue('departments')?.includes(dept._id)}
              onChange={(e) => {
                const currentValues = form.getFieldValue('departments') || [];
                const newValues = e.target.checked
                  ? [...currentValues, dept._id]
                  : currentValues.filter(id => id !== dept._id);
                form.setFieldsValue({ departments: newValues });
              }}
            >
              {dept.name}
            </Checkbox>
          </div>
        ))
      ) : (
        <div>No departments available</div>
      )}
    </div>
  );

  const columns = [
    { 
      title: 'Serial No', 
      key: 'serialNo', 
      width: 80,
      render: (_, __, index) => index + 1,
    },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { 
      title: 'Parent Category', 
      dataIndex: ['parent', 'name'], 
      key: 'parent', 
      render: (text) => text || 'None' 
    },
    {
      title: 'Type',
      key: 'type',
      render: (_, record) => {
        const types = [];
        if (record.isPastryProduct) types.push('Pastry');
        if (record.isCake) types.push('Cake');
        if (record.isBiling) types.push('Biling');
        return types.length > 0 ? types.join(', ') : 'None';
      },
    },
    {
      title: 'Departments',
      key: 'departments',
      render: (_, record) => {
        const deptNames = Array.isArray(record.departments) 
          ? record.departments.map(dept => dept.name).filter(name => name)
          : [];
        return deptNames.length > 0 ? deptNames.join(', ') : 'None';
      },
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (image) => {
        const imageSrc = getImageSrc(image);
        return imageSrc ? (
          <img src={imageSrc} alt="Category" style={{ maxWidth: '50px', maxHeight: '50px' }} />
        ) : 'No Image';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure you want to delete this category?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>Category List</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Select
            value={departmentFilter}
            onChange={handleDepartmentFilterChange}
            style={{ width: 150 }}
            placeholder="Filter by Department"
          >
            <Option value="all">All</Option>
            {departments.map(dept => (
              <Option key={dept._id} value={dept._id}>{dept.name}</Option>
            ))}
          </Select>
          <Select
            value={typeFilter}
            onChange={handleTypeFilterChange}
            style={{ width: 150 }}
            placeholder="Filter by Type"
          >
            <Option value="all">All</Option>
            <Option value="pastry">Pastry</Option>
            <Option value="cake">Cake</Option>
            <Option value="biling">Biling</Option>
          </Select>
          <Button type="primary" onClick={() => router.push('/categories/add')}>
            Create Category
          </Button>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={filteredCategories}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="Edit Category"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            label="Category Name"
            name="name"
            rules={[{ required: true, message: 'Please enter a category name!' }]}
          >
            <Input placeholder="e.g., Pastries" />
          </Form.Item>
          <Form.Item
            label="Departments"
            name="departments"
            rules={[{ required: false }]}
          >
            <Select
              mode="multiple"
              placeholder="Select departments"
              allowClear
              dropdownRender={dropdownRender}
              style={{ width: '100%' }}
            >
              {departments.map(dept => (
                <Option key={dept._id} value={dept._id} disabled>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="isPastryProduct"
                valuePropName="checked"
                rules={[{ required: false }]}
              >
                <Checkbox>Pastry</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="isCake"
                valuePropName="checked"
                rules={[{ required: false }]}
              >
                <Checkbox>Cake</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="isBiling"
                valuePropName="checked"
                rules={[{ required: false }]}
              >
                <Checkbox>Biling</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Parent Category"
            name="parent"
            rules={[{ required: false }]}
          >
            <Select placeholder="Select a parent category" allowClear>
              {categories
                .filter(cat => cat._id !== selectedCategory?._id)
                .map(category => (
                  <Option key={category._id} value={category._id}>{category.name}</Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item label="Category Image">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Upload Image (1 max)</Button>
            </Upload>
            {previewImage && (
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <img src={previewImage} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                <br />
                <Button 
                  type="link" 
                  onClick={() => { setFileList([]); setPreviewImage(null); }} 
                  style={{ marginTop: '5px' }}
                >
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

export default CategoryListPage;