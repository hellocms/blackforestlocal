import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Table, Space, Popconfirm, Switch } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const AlbumEditForm = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [albums, setAlbums] = useState([]);
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  // ✅ Fetch Albums List
  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/albums`);
      const data = await response.json();
      if (response.ok) {
        setAlbums(data); // ✅ Now includes "enabled" field from the DB
      } else {
        message.error('Failed to fetch albums');
      }
    } catch (error) {
      console.error('❌ Error fetching albums:', error);
      message.error('Error fetching albums');
    }
  };

  // ✅ Create New Album
  const createAlbum = async () => {
    if (!name.trim()) {
      message.error('Album name cannot be empty!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/albums`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      if (response.ok) {
        message.success("✅ Album created successfully!");
        setName(""); // Reset input
        fetchAlbums(); // Refresh album list
      } else {
        message.error(`❌ ${data.message}`); // ✅ Handle duplicate album name error
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      message.error("❌ Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Delete Album
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/albums/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        message.success("Album deleted successfully!");
        fetchAlbums(); // Refresh album list
      } else {
        message.error("❌ Failed to delete album");
      }
    } catch (error) {
      console.error("❌ Error deleting album:", error);
      message.error("Error deleting album");
    }
  };

  // ✅ Handle Edit Album
  const handleEdit = (id) => {
    router.push(`/albums/edit/${id}`);
  };

  // ✅ Handle Toggle Enable/Disable Actions
  const handleToggle = async (id, currentStatus) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/albums/${id}/toggle-status`, {
        method: "PUT",
      });

      const data = await response.json();

      if (response.ok) {
        message.success(`✅ Album ${data.album.enabled ? "enabled" : "disabled"} successfully`);
        fetchAlbums(); // Refresh the list
      } else {
        message.error("❌ Failed to update album status");
      }
    } catch (error) {
      console.error("❌ Error updating album status:", error);
      message.error("Error updating album status");
    }
  };

  // ✅ Table Columns
  const columns = [
    {
      title: 'Album Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Enable Actions',
      key: 'enabled',
      render: (_, record) => (
        <Switch checked={record.enabled} onChange={() => handleToggle(record._id, record.enabled)} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record._id)}
            disabled={!record.enabled} // ✅ Disable Edit when "enabled" is false
          />
          <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record._id)} okText="Yes" cancelText="No">
            <Button icon={<DeleteOutlined />} disabled={!record.enabled} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      
      {/* ✅ Album Creation Form */}
      <h2>Create New Album</h2>
      <Form layout="vertical" onFinish={createAlbum}>
        <Form.Item
          label="Album Name"
          name="name"
          rules={[{ required: true, message: 'Please enter album name!' }]}
        >
          <Input value={name} onChange={e => setName(e.target.value)} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>Create Album</Button>
          <Button style={{ marginLeft: '10px' }} onClick={() => setName('')} disabled={loading}>Cancel</Button>
        </Form.Item>
      </Form>

      {/* ✅ Album List Table */}
      <h2 style={{ marginTop: '20px' }}>Album List</h2>
      <Table
        columns={columns}
        dataSource={albums.map(album => ({ ...album, key: album._id }))}
        pagination={{ pageSize: 5 }}
      />
      
    </div>
  );
};

export default AlbumEditForm;
