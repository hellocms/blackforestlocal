import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Row, Col, Select } from 'antd';
import { useRouter } from 'next/router';

const { Option } = Select;

const CreateProduct = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({ product_name: '', category: '', barcode_no: '' }); // For field-specific errors
  const router = useRouter();

  // Fetch existing categories
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
    setErrors({ product_name: '', category: '', barcode_no: '' }); // Clear previous errors
    try {
      const response = await fetch('http://localhost:5001/api/dealer/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      console.log('Backend Response:', result); // Debug response
      if (response.ok) {
        message.success(result.message || 'Product created successfully');
        form.resetFields();
        router.push('/dealers/product/list'); // Redirect to list page
      } else {
        // Handle specific error messages
        if (result.message === 'Barcode number already exists') {
          setErrors((prev) => ({ ...prev, barcode_no: result.message }));
        } else if (result.message === 'This product name already exists in the selected category') {
          setErrors((prev) => ({ ...prev, product_name: result.message }));
        } else if (result.message.includes('category')) {
          setErrors((prev) => ({ ...prev, category: result.message }));
        } else if (result.message.includes('required')) {
          // Handle general required field errors
          if (result.message.includes('product_name')) setErrors((prev) => ({ ...prev, product_name: 'Product name is required' }));
          if (result.message.includes('category')) setErrors((prev) => ({ ...prev, category: 'Category is required' }));
          if (result.message.includes('barcode_no')) setErrors((prev) => ({ ...prev, barcode_no: 'Barcode number is required' }));
        } else {
          message.error(result.message || 'An error occurred');
        }
      }
    } catch (err) {
      message.error('Server error while creating product');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Form Validation Errors:', errorInfo); // Debug form validation
    const newErrors = { product_name: '', category: '', barcode_no: '' };
    errorInfo.errorFields.forEach((field) => {
      if (field.name[0] === 'product_name') newErrors.product_name = field.errors[0];
      if (field.name[0] === 'category') newErrors.category = field.errors[0];
      if (field.name[0] === 'barcode_no') newErrors.barcode_no = field.errors[0];
    });
    setErrors(newErrors);
    message.error('Please fill in all required fields correctly');
  };

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={24} sm={20} md={16} lg={12}>
          <h1 style={{ color: '#000000', textAlign: 'center', marginBottom: '20px' }}>
            Add New Product
          </h1>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            initialValues={{ product_name: '', category: null, barcode_no: '', description: '', price: '', stock_quantity: '' }}
            style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            <Form.Item
              validateStatus={errors.product_name ? 'error' : ''}
              help={errors.product_name || ''}
              label={<span style={{ color: '#000000' }}>Product Name</span>}
              name="product_name"
              rules={[{ required: true, message: 'Please enter the product name' }]}
            >
              <Input placeholder="Enter product name" style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }} />
            </Form.Item>

            <Form.Item
              validateStatus={errors.category ? 'error' : ''}
              help={errors.category || ''}
              label={<span style={{ color: '#000000' }}>Category</span>}
              name="category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select
                placeholder="Select a category"
                style={{ width: '100%', color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
              >
                {categories.map((cat) => (
                  <Option key={cat._id} value={cat._id}>
                    {cat.category_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              validateStatus={errors.barcode_no ? 'error' : ''}
              help={errors.barcode_no || ''}
              label={<span style={{ color: '#000000' }}>Barcode No</span>}
              name="barcode_no"
              rules={[{ required: true, message: 'Please enter the barcode number' }]}
            >
              <Input placeholder="Enter barcode number" style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }} />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#000000' }}>Description</span>}
              name="description"
            >
              <Input.TextArea rows={4} placeholder="Enter description" style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }} />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#000000' }}>Price</span>}
              name="price"
              rules={[
                {
                  validator: (_, value) => {
                    if (value && (isNaN(value) || value < 0)) {
                      return Promise.reject('Please enter a valid price');
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input placeholder="Enter price (optional)" style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }} />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#000000' }}>Stock Quantity</span>}
              name="stock_quantity"
              rules={[
                {
                  validator: (_, value) => {
                    if (value && (isNaN(value) || value < 0)) {
                      return Promise.reject('Please enter a valid quantity');
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input placeholder="Enter stock quantity (optional)" style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }} />
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

export default CreateProduct;