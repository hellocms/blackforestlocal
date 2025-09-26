import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Upload, message, Checkbox, Row, Col } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const { Option } = Select;

const AddCategoryPage = () => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]); // New: Departments state
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkboxStates, setCheckboxStates] = useState({
    isPastryProduct: false,
    isCake: false,
    isBiling: false,
  });
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.info('Please log in as Superadmin');
      router.push('/login');
    } else {
      fetchCategories(token);
      fetchDepartments(token); // New: Fetch departments
    }
  }, [router]);

  const fetchCategories = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/categories/list-categories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setCategories(data);
      else message.error('Failed to fetch categories');
    } catch (error) {
      message.error('Error fetching categories');
    }
  };

  // New: Fetch departments
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

  const handleCheckboxChange = (name, checked) => {
    setCheckboxStates(prev => ({
      ...prev,
      [name]: checked,
    }));
    // Reset parent category selection when any checkbox changes
    form.setFieldsValue({ parent: undefined });
  };

  // Filter categories for parent dropdown based on selected checkboxes
  const filteredParentCategories = categories.filter(category => {
    const { isPastryProduct, isCake, isBiling } = checkboxStates;
    // If no checkboxes are selected, show all categories
    if (!isPastryProduct && !isCake && !isBiling) return true;
    // Show categories that match any selected checkbox
    return (
      (isPastryProduct && category.isPastryProduct) ||
      (isCake && category.isCake) ||
      (isBiling && category.isBiling)
    );
  });

  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('name', values.name);
    if (values.department) formData.append('department', values.department); // New: Append department ID
    if (values.parent) formData.append('parent', values.parent);
    formData.append('isPastryProduct', values.isPastryProduct || false);
    formData.append('isCake', values.isCake || false);
    formData.append('isBiling', values.isBiling || false);
    console.log('FileList:', fileList);
    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append('image', fileList[0].originFileObj);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        message.success('Category created successfully');
        form.resetFields();
        setFileList([]);
        setPreviewImage(null);
        setCheckboxStates({ isPastryProduct: false, isCake: false, isBiling: false });
      } else {
        message.error(data.message || 'Failed to create category');
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

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center' }}>Add Category</h2>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          label="Category Name"
          name="name"
          rules={[{ required: true, message: 'Please enter a category name!' }]}
        >
          <Input placeholder="e.g., Pastries" />
        </Form.Item>
        {/* New: Department Dropdown */}
        <Form.Item
          label="Department"
          name="department"
          rules={[{ required: false }]} // Optional; make required: true if needed
        >
          <Select placeholder="Select a department" allowClear>
            <Option key="none" value={null}>None</Option>
            {departments.length > 0 ? (
              departments.map(dept => (
                <Option key={dept._id} value={dept._id}>{dept.name}</Option>
              ))
            ) : (
              <Option disabled>No departments available</Option>
            )}
          </Select>
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="isPastryProduct"
              valuePropName="checked"
              rules={[{ required: false }]}
            >
              <Checkbox onChange={(e) => handleCheckboxChange('isPastryProduct', e.target.checked)}>
                Pastry
              </Checkbox>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="isCake"
              valuePropName="checked"
              rules={[{ required: false }]}
            >
              <Checkbox onChange={(e) => handleCheckboxChange('isCake', e.target.checked)}>
                Cake
              </Checkbox>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="isBiling"
              valuePropName="checked"
              rules={[{ required: false }]}
            >
              <Checkbox onChange={(e) => handleCheckboxChange('isBiling', e.target.checked)}>
                Biling
              </Checkbox>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label="Parent Category"
          name="parent"
          rules={[{ required: false }]}
        >
          <Select placeholder="Select a parent category" allowClear>
            {filteredParentCategories.length > 0 ? (
              filteredParentCategories.map(category => (
                <Option key={category._id} value={category._id}>{category.name}</Option>
              ))
            ) : (
              <Option disabled>No matching parent categories available</Option>
            )}
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
          <Button type="primary" htmlType="submit" loading={loading} block>
            Save
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddCategoryPage;