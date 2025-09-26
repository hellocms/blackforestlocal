import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Row, Col, Select } from 'antd';
import { useRouter } from 'next/router';

const { Option } = Select;

const CreateDealerCategory = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({ category_name: '' }); // State for category name error
  const router = useRouter();

  // Fetch existing categories for parent selection
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/dealer/categories', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        if (response.ok) {
          setCategories(result);
        } else {
          message.error(result.message || 'Failed to fetch categories');
        }
      } catch (err) {
        message.error('Server error while fetching categories');
        console.error('Error:', err);
      }
    };
    fetchCategories();
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    setErrors({ category_name: '' }); // Clear previous errors
    try {
      const response = await fetch('http://localhost:5001/api/dealer/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      if (response.ok) {
        message.success(result.message);
        form.resetFields();
        router.push('/dealers/category/list'); // Redirect to list page
      } else {
        // Handle specific error for category name
        if (result.message === 'Category name already exists') {
          setErrors({ category_name: result.message });
        } else if (result.message === 'Parent category not found') {
          message.error(result.message);
        } else {
          message.error(result.message);
        }
      }
    } catch (err) {
      message.error('Server error while creating dealer category');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
    message.error('Please fill in all required fields correctly');
  };

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={24} sm={20} md={16} lg={12}>
          <h1 style={{ color: '#000000', textAlign: 'center', marginBottom: '20px' }}>
            Add New Dealer Category
          </h1>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            initialValues={{ category_name: '', description: '', parent_category: null }}
            style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            <Form.Item
              validateStatus={errors.category_name ? 'error' : ''}
              help={errors.category_name || ''}
              label={<span style={{ color: '#000000' }}>Category Name</span>}
              name="category_name"
              rules={[{ required: true, message: 'Please enter the category name' }]}
            >
              <Input placeholder="Enter category name" style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }} />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#000000' }}>Description</span>}
              name="description"
            >
              <Input.TextArea rows={4} placeholder="Enter description" style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }} />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#000000' }}>Parent Category</span>}
              name="parent_category"
            >
              <Select
                placeholder="Select a parent category (optional)"
                allowClear
                style={{ width: '100%', color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
              >
                {categories.map((category) => (
                  <Option key={category._id} value={category._id}>
                    {category.category_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{
                  background: 'linear-gradient(to right, #34495e, #1a3042)',
                  borderColor: '#34495e',
                  width: '100%',
                  color: '#ffffff',
                }}
              >
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default CreateDealerCategory;