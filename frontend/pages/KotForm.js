import React from 'react';
import { Form, Input, DatePicker, Select, Button, Card, Typography, Row, Col, message, Divider } from 'antd';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const KotForm = () => {
  const [form] = Form.useForm();

  // Handle form submission
  const onFinish = async (values) => {
    try {
      // Format dates
      const deliveryDate = values.deliveryDate ? values.deliveryDate.toISOString() : null;
      const birthdayDate = values.birthdayDate ? values.birthdayDate.toISOString() : null

      // Prepare data for submission
      const formData = {
        deliveryDate,
        deliveryTime: values.deliveryTime,
        customerName: values.customerName,
        customerNumber: values.customerNumber,
        address: values.address,
        email: values.email,
        birthdayDate,
        cakeModel: values.cakeModel,
        weight: values.weight,
        flavour: values.flavour,
        type: values.type,
        alteration: values.alteration,
        specialCare: values.specialCare,
        amount: values.amount,
        advance: values.advance,
        branch: values.branch,
        salesMan: values.salesMan,
        deliveryType: values.deliveryType,
      };

      // Submit to backend
      const response = await fetch('/api/kot-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        message.success('Order placed successfully!');
        form.resetFields();
        // Optionally redirect or print the order
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error('Error submitting order');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <Card>
        <Row justify="center">
          <Col>
            <Title level={3}>Black Forest Cakes</Title>
            <Text>www.theblackforestcakes.com</Text><br />
            <Text>theblackforestcakes.in@gmail.com</Text><br />
            <Text>@blackforestcakethoothukudi</Text><br />
            <Text>Chidambaram Nagar: 9701470656 | VVD Signal: 9500542654 | Ettayapuram Road: 9501470656</Text><br />
            <Text>Antony Church: 6385796586 | Sawyie-Puram: 7375666586 | Karunai College: 9500266656 | 3rd Mile: 9600848656</Text>
          </Col>
        </Row>
      </Card>

      <Divider />

      {/* Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          date: moment(),
          orderTime: moment().format('hh:mm A'),
        }}
      >
        <Card title="Order Information">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Date" name="date">
                <DatePicker disabled style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Order Time" name="orderTime">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Delivery Date" name="deliveryDate" rules={[{ required: true, message: 'Please select delivery date' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Delivery Time" name="deliveryTime" rules={[{ required: true, message: 'Please enter delivery time' }]}>
                <Input placeholder="e.g., 02:00 PM" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider />

        <Card title="Customer Information">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Customer Name" name="customerName" rules={[{ required: true, message: 'Please enter customer name' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Customer Number" name="customerNumber" rules={[{ required: true, message: 'Please enter customer number' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Address" name="address" rules={[{ required: true, message: 'Please enter address' }]}>
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider />

        <Card title="Cake Details">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Birthday Date" name="birthdayDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Cake Model" name="cakeModel" rules={[{ required: true, message: 'Please enter cake model' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Weight (kg)" name="weight" rules={[{ required: true, message: 'Please enter weight' }]}>
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Flavour" name="flavour" rules={[{ required: true, message: 'Please select flavour' }]}>
                <Select>
                  <Option value="Chocolate">Chocolate</Option>
                  <Option value="Vanilla">Vanilla</Option>
                  <Option value="Strawberry">Strawberry</Option>
                  <Option value="Black Forest">Black Forest</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Type" name="type" rules={[{ required: true, message: 'Please select type' }]}>
                <Select>
                  <Option value="Fresh Cream">Fresh Cream</Option>
                  <Option value="Choco Truffle">Choco Truffle</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Alteration (if any)" name="alteration">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Special Care" name="specialCare">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider />

        <Card title="Payment Details">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Amount" name="amount" rules={[{ required: true, message: 'Please enter amount' }]}>
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Advance" name="advance" rules={[{ required: true, message: 'Please enter advance' }]}>
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Balance" name="balance">
                <Input type="number" disabled />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider />

        <Card title="Your Attention!">
          <Paragraph>
            <ol>
              <li>Bring this receipt at the time of delivery please.</li>
              <li>Minimum amount of 50% of the total amount should be paid as advance for wedding cakes.</li>
              <li>Advance once received will not be returned at any circumstances.</li>
              <li>The advance received against cancellation order will be adjusted in future orders or purchases of any of our outlet products.</li>
              <li>Cancellation of order should be intimated at the minimum time of 48 hrs before the time of delivery.</li>
              <li>Cancellation will not be done through phone (Customer should come in person).</li>
              <li>For door delivery vehicle fare will be collected from the customer.</li>
              <li>Above 2kg birthday cakes we haven’t provided carry bag, sorry.</li>
              <li>Fresh cream cakes, choco truffle cakes can be kept in normal temperature for only two hours. After that it should be kept in chiller and it should not be kept in freezer.</li>
            </ol>
          </Paragraph>
        </Card>

        <Divider />

        <Card>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Branch" name="branch" rules={[{ required: true, message: 'Please select branch' }]}>
                <Select>
                  <Option value="Chidambaram Nagar">Chidambaram Nagar</Option>
                  <Option value="VVD Signal">VVD Signal</Option>
                  <Option value="Ettayapuram Road">Ettayapuram Road</Option>
                  <Option value="Antony Church">Antony Church</Option>
                  <Option value="Sawyie-Puram">Sawyie-Puram</Option>
                  <Option value="Karunai College">Karunai College</Option>
                  <Option value="3rd Mile">3rd Mile</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Sales Man" name="salesMan" rules={[{ required: true, message: 'Please enter sales man' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Delivery Type" name="deliveryType" rules={[{ required: true, message: 'Please select delivery type' }]}>
                <Select>
                  <Option value="In-Store Pickup">In-Store Pickup</Option>
                  <Option value="Door Delivery">Door Delivery</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider />

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit Order
          </Button>
          <Button style={{ marginLeft: '10px' }} onClick={() => window.print()}>
            Print
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default KotForm;