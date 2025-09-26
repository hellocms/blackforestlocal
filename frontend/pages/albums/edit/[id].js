import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message, Switch } from 'antd';
import { useRouter } from 'next/router';

const EditAlbum = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [album, setAlbum] = useState(null);
  const router = useRouter();
  const { id } = router.query;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  // ✅ Fetch Album Details When Page Loads
  useEffect(() => {
    if (router.isReady && id) {
      fetchAlbumDetails();
    }
  }, [router.isReady, id]);

  const fetchAlbumDetails = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/albums/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setAlbum(data);
        form.setFieldsValue({
          name: data.name,
          enabled: data.enabled,
        });
      } else {
        message.error('Failed to fetch album details');
      }
    } catch (error) {
      console.error('❌ Error fetching album:', error);
      message.error('Error fetching album details');
    }
  };

  // ✅ Handle Update Album
  const onFinish = async (values) => {
    console.log('🚀 Updating album:', values);
    setLoading(true);
  
    try {
      const response = await fetch(`${BACKEND_URL}/api/albums/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
  
      const responseData = await response.json();
  
      if (response.ok) {
        message.success("✅ Album updated successfully!");
        router.push("/album-list"); // ✅ Redirect after update
      } else {
        message.error(`❌ ${responseData.message}`); // ✅ Handle duplicate album name error
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      message.error("❌ Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h2>Edit Album</h2>

      {album ? (
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Album Name"
            name="name"
            rules={[{ required: true, message: 'Please enter album name!' }]}
          >
            <Input placeholder="Enter album name" />
          </Form.Item>

          {/* ✅ Enable/Disable Switch */}
          <Form.Item label="Enable Actions" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>Update</Button>
            <Button style={{ marginLeft: '10px' }} onClick={() => router.push('/album-list')} disabled={loading}>Cancel</Button>
          </Form.Item>
        </Form>
      ) : (
        <p>Loading album details...</p>
      )}
    </div>
  );
};

export default EditAlbum;
