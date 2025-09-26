import React, { useState } from 'react';
import { Form, Input, Button, Select, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const { Option } = Select;

const EmployeeCreatePage = () => {
  const [form] = Form.useForm();
  const [fileListAadhaar, setFileListAadhaar] = useState([]);
  const [fileListPhoto, setFileListPhoto] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('phoneNumber', values.phoneNumber);
    formData.append('address', values.address);
    formData.append('team', values.team);

    if (fileListAadhaar.length > 0 && fileListAadhaar[0].originFileObj) {
      formData.append('aadhaar', fileListAadhaar[0].originFileObj);
    }
    if (fileListPhoto.length > 0 && fileListPhoto[0].originFileObj) {
      formData.append('photo', fileListPhoto[0].originFileObj);
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.info('Please log in as Superadmin or Admin');
        router.push('/login');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/employees`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        message.success('Employee created successfully');
        form.resetFields();
        setFileListAadhaar([]);
        setFileListPhoto([]);
        setPreviewImage(null);
        router.push('/employees');
      } else {
        message.error(data.message || 'Failed to create employee');
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
    maxCount: 1, // Limit to one file
    accept: 'image/jpeg,image/png,application/pdf', // Accept JPG, PNG, PDF
  };

  const photoUploadProps = {
    beforeUpload: handlePhotoUpload,
    onRemove: () => {
      setFileListPhoto([]);
      setPreviewImage(null);
    },
    fileList: fileListPhoto,
    showUploadList: false,
    maxCount: 1, // Limit to one file
    accept: 'image/jpeg,image/png', // Accept JPG, PNG only
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center' }}>Add Employee</h2>
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
        <Form.Item label="Photo (Required)">
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
          <Button type="primary" htmlType="submit" loading={loading} block>
            Save
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EmployeeCreatePage;