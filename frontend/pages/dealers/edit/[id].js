import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, Button, message, Row, Col } from 'antd';

const EditDealer = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ phone_no: '', gst: '' });
  const router = useRouter();
  const { id } = router.query; // Get the dealer ID from the URL

  // Fetch dealer details by ID
  useEffect(() => {
    if (id) {
      const fetchDealer = async () => {
        try {
          const response = await fetch(`http://localhost:5001/api/dealers/${id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const result = await response.json();
          if (response.ok) {
            form.setFieldsValue(result); // Pre-fill the form with dealer data
          } else {
            message.error(result.message || 'Failed to fetch dealer details');
          }
        } catch (err) {
          message.error('Server error while fetching dealer details');
          console.error('Error:', err);
        }
      };
      fetchDealer();
    }
  }, [id, form]);

  // Handle form submission
  const onFinish = async (values) => {
    setLoading(true);
    setErrors({ phone_no: '', gst: '' });
    try {
      const response = await fetch(`http://localhost:5001/api/dealers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      if (response.ok) {
        message.success(result.message || 'Dealer updated successfully');
        router.push('/dealers/list'); // Redirect to list page after update
      } else {
        setErrors((prev) => ({
          ...prev,
          [result.field]: result.message,
        }));
      }
    } catch (err) {
      message.error('Server error while updating dealer');
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
            Edit Dealer
          </h1>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            <Form.Item
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
                Update
              </Button>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

// Opt out of Layout component
EditDealer.useLayout = false;

export default EditDealer;