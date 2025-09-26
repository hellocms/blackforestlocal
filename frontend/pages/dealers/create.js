import React, { useState } from 'react';
import { Form, Input, Button, message, Row, Col } from 'antd';
import { useRouter } from 'next/router';

const CreateDealer = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ phone_no: '', gst: '' });
  const router = useRouter();

  // Handle form submission
  const onFinish = async (values) => {
    setLoading(true);
    setErrors({ phone_no: '', gst: '' }); // Clear previous errors
    try {
      const response = await fetch('http://localhost:5001/api/dealers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      if (response.ok) {
        message.success(result.message); // Ant Design success message
        form.resetFields(); // Reset form fields
        router.push('/dealers/list'); // Redirect to list page after successful creation
      } else {
        // Set field-specific error based on response
        setErrors((prev) => ({
          ...prev,
          [result.field]: result.message,
        }));
      }
    } catch (err) {
      message.error('Server error while creating dealer');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission failure
  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
    message.error('Please fill in all required fields correctly');
  };

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={24} sm={20} md={16} lg={12}>
          <h1 style={{ color: '#000000', textAlign: 'center', marginBottom: '20px' }}>
            Add New Dealer
          </h1>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            initialValues={{
              dealer_name: '',
              address: '',
              phone_no: '',
              gst: '',
              pan: '',
              msme: '',
              tan: '',
            }}
            style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            <Form.Item
              validateStatus={errors.phone_no ? 'error' : ''}
              help={errors.phone_no || ''}
              label={<span style={{ color: '#000000' }}>Dealer Name</span>}
              name="dealer_name"
              rules={[{ required: true, message: 'Please enter the dealer name' }]}
            >
              <Input placeholder="Enter dealer name" style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }} />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#000000' }}>Address</span>}
              name="address"
            >
              <Input.TextArea rows={4} placeholder="Enter address" style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }} />
            </Form.Item>

            <Form.Item
              validateStatus={errors.phone_no ? 'error' : ''}
              help={errors.phone_no || ''}
              label={<span style={{ color: '#000000' }}>Phone Number</span>}
              name="phone_no"
              rules={[
                { required: true, message: 'Please enter the phone number' },
                {
                  pattern: /^\d{10}$/,
                  message: 'Phone number must be exactly 10 digits',
                },
              ]}
            >
              <Input placeholder="Enter 10-digit phone number" style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }} />
            </Form.Item>

            <Form.Item
              validateStatus={errors.gst ? 'error' : ''}
              help={errors.gst || ''}
              label={<span style={{ color: '#000000' }}>GST</span>}
              name="gst"
            >
              <Input placeholder="Enter GST number" style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }} />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#000000' }}>PAN</span>}
              name="pan"
            >
              <Input placeholder="Enter PAN number" style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }} />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#000000' }}>MSME</span>}
              name="msme"
            >
              <Input placeholder="Enter MSME status or number" style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }} />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#000000' }}>TAN</span>}
              name="tan"
            >
              <Input placeholder="Enter TAN number" style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }} />
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

export default CreateDealer;