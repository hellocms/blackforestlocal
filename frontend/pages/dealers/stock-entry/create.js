import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Row, Col, Select } from 'antd';
import { useRouter } from 'next/router';

const { Option } = Select;

const CreateStockEntry = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dealers, setDealers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [errors, setErrors] = useState({ dealer: '', category: '', product: '', pcs_count: '', amount: '' });
  const router = useRouter();

  // Fetch dealers
  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/dealers', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        if (response.ok) {
          setDealers(result);
        } else {
          message.error(result.message || 'Failed to fetch dealers');
        }
      } catch (err) {
        message.error('Server error while fetching dealers');
        console.error('Error:', err);
      }
    };
    fetchDealers();
  }, []);

  // Fetch categories
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

  // Fetch products based on selected category
  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedCategory) {
        setProducts([]);
        form.setFieldsValue({ product: null });
        return;
      }

      try {
        const response = await fetch(`http://localhost:5001/api/dealer/products?category=${selectedCategory}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        if (response.ok) {
          setProducts(result);
          form.setFieldsValue({ product: null }); // Reset product selection when category changes
        } else {
          message.error(result.message || 'Failed to fetch products');
        }
      } catch (err) {
        message.error('Server error while fetching products');
        console.error('Error:', err);
      }
    };
    fetchProducts();
  }, [selectedCategory, form]);

  const onFinish = async (values) => {
    setLoading(true);
    setErrors({ dealer: '', category: '', product: '', pcs_count: '', amount: '' }); // Clear previous errors
    try {
      const response = await fetch('http://localhost:5001/api/dealer/stock-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      console.log('Backend Response:', result);
      if (response.ok) {
        message.success(result.message || 'Stock entry created successfully');
        form.resetFields();
        router.push('/dealers/stock-entry/list'); // Redirect to list page
      } else {
        if (result.message.includes('required')) {
          if (result.message.includes('dealer')) setErrors((prev) => ({ ...prev, dealer: 'Dealer is required' }));
          if (result.message.includes('category')) setErrors((prev) => ({ ...prev, category: 'Category is required' }));
          if (result.message.includes('product')) setErrors((prev) => ({ ...prev, product: 'Product is required' }));
          if (result.message.includes('pcs_count')) setErrors((prev) => ({ ...prev, pcs_count: 'Pieces count is required' }));
          if (result.message.includes('amount')) setErrors((prev) => ({ ...prev, amount: 'Amount is required' }));
        } else if (result.message.includes('Pieces count')) {
          setErrors((prev) => ({ ...prev, pcs_count: result.message }));
        } else if (result.message.includes('Amount')) {
          setErrors((prev) => ({ ...prev, amount: result.message }));
        } else {
          message.error(result.message || 'An error occurred');
        }
      }
    } catch (err) {
      message.error('Server error while creating stock entry');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Form Validation Errors:', errorInfo);
    const newErrors = { dealer: '', category: '', product: '', pcs_count: '', amount: '' };
    errorInfo.errorFields.forEach((field) => {
      if (field.name[0] === 'dealer') newErrors.dealer = field.errors[0];
      if (field.name[0] === 'category') newErrors.category = field.errors[0];
      if (field.name[0] === 'product') newErrors.product = field.errors[0];
      if (field.name[0] === 'pcs_count') newErrors.pcs_count = field.errors[0];
      if (field.name[0] === 'amount') newErrors.amount = field.errors[0];
    });
    setErrors(newErrors);
    message.error('Please fill in all required fields correctly');
  };

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={24} sm={20} md={16} lg={12}>
          <h1 style={{ color: '#000000', textAlign: 'center', marginBottom: '20px' }}>
            Add Stock Entry
          </h1>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            initialValues={{ dealer: null, category: null, product: null, pcs_count: '', amount: '' }}
            style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            <Form.Item
              validateStatus={errors.dealer ? 'error' : ''}
              help={errors.dealer || ''}
              label={<span style={{ color: '#000000' }}>Dealer</span>}
              name="dealer"
              rules={[{ required: true, message: 'Please select a dealer' }]}
            >
              <Select
                placeholder="Select a dealer"
                style={{ width: '100%', color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
              >
                {dealers.map((dealer) => (
                  <Option key={dealer._id} value={dealer._id}>
                    {dealer.dealer_name} {/* Changed from dealer.name to dealer.dealer_name */}
                  </Option>
                ))}
              </Select>
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
                onChange={(value) => setSelectedCategory(value)}
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
              validateStatus={errors.product ? 'error' : ''}
              help={errors.product || ''}
              label={<span style={{ color: '#000000' }}>Product</span>}
              name="product"
              rules={[{ required: true, message: 'Please select a product' }]}
            >
              <Select
                placeholder="Select a product"
                style={{ width: '100%', color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
                disabled={!selectedCategory}
              >
                {products.map((prod) => (
                  <Option key={prod._id} value={prod._id}>
                    {prod.product_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              validateStatus={errors.pcs_count ? 'error' : ''}
              help={errors.pcs_count || ''}
              label={<span style={{ color: '#000000' }}>Pieces Count</span>}
              name="pcs_count"
              rules={[{ required: true, message: 'Please enter the pieces count' }]}
            >
              <Input
                type="number"
                placeholder="Enter pieces count"
                min={1}
                style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
              />
            </Form.Item>

            <Form.Item
              validateStatus={errors.amount ? 'error' : ''}
              help={errors.amount || ''}
              label={<span style={{ color: '#000000' }}>Amount (₹)</span>}
              name="amount"
              rules={[{ required: true, message: 'Please enter the amount' }]}
            >
              <Input
                type="number"
                placeholder="Enter amount"
                min={0}
                step="0.01"
                style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
              />
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

// Opt out of Layout component
CreateStockEntry.useLayout = false;

export default CreateStockEntry;