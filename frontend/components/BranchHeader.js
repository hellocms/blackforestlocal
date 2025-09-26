import React, { useState, useEffect } from 'react';
import { Layout, Space, Typography, Button, Menu } from 'antd';
import { UserOutlined, LogoutOutlined, ShopOutlined, FileTextOutlined, FileDoneOutlined, DollarOutlined, BankOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';

const { Header } = Layout;
const { Text } = Typography;

const BranchHeader = () => {
  const [branchName, setBranchName] = useState('');
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  const menuItems = [
    { key: '/branch/[branchId]', label: 'Billing', link: `/branch/${branchName ? branchName.replace(/\s+/g, '-').toLowerCase() : 'unknown'}`, icon: <ShopOutlined /> },
    { key: '/dealers/bill-entry/create', label: 'Stock Entry', link: '/dealers/bill-entry/create', icon: <FileTextOutlined /> },
    { key: '/dealers/closing-entry/closingentry', label: 'Closing Entry', link: '/dealers/closing-entry/closingentry', icon: <FileDoneOutlined /> },
    { key: '/dealers/expense/ExpenseEntry', label: 'Expense Entry', link: '/dealers/closing-entry/ExpenseSheet', icon: <DollarOutlined /> },
    { key: '/branch/ViewOrder', label: 'ViewOrders', link: '/branch/ViewOrder', icon: <FileDoneOutlined />  },
  ];

  const fetchBranchDetails = async (token, branchId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/branches`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const branch = data.find(b => b._id === branchId);
        if (branch) {
          setBranchName(branch.name || 'Unknown Branch');
        } else {
          message.error('Branch not found');
          setBranchName('Unknown Branch');
        }
      } else {
        message.error('Failed to fetch branches');
        setBranchName('Unknown Branch');
      }
    } catch (error) {
      console.error('Fetch branches error:', error);
      message.error('Error fetching branches');
      setBranchName('Unknown Branch');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.branchId) {
        fetchBranchDetails(token, decoded.branchId);
      } else {
        setBranchName('Unknown Branch');
      }
    } catch (error) {
      setBranchName('Unknown Branch');
      router.push('/login');
    }
  }, [router]);

  const handleMenuClick = ({ key }) => {
    const item = menuItems.find(menu => menu.key === key);
    if (item && item.key === '/branch/[branchId]') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.branchId) {
            router.push(`/branch/${decoded.branchId}`);
          } else {
            message.error('Branch ID not available');
          }
        } catch (error) {
          message.error('Error decoding token');
        }
      }
    } else if (item) {
      router.push(item.link);
    }
  };

  return (
    <Header
      style={{
        background: '#000000',
        padding: '0 20px',
        color: '#FFFFFF',
        height: '64px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Space align="center">
          <UserOutlined style={{ fontSize: '16px', color: '#FFFFFF' }} />
          <Text style={{ fontSize: '14px', color: '#FFFFFF' }}>
            {branchName}
          </Text>
        </Space>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[router.pathname]}
          onClick={handleMenuClick}
          items={menuItems.map(item => ({
            key: item.key,
            label: item.label,
            icon: item.icon,
            style: {
              color: router.pathname === item.key ? '#FFFF00' : '#FFFFFF',
              fontWeight: router.pathname === item.key ? 'bold' : 'normal',
              background: router.pathname === item.key ? '#1a1a1a' : 'transparent',
              margin: '0 10px',
            },
          }))}
          style={{ 
            background: 'transparent', 
            borderBottom: 'none', 
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            lineHeight: '64px',
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{ fontSize: '16px', color: '#FFFFFF' }}
        >
          Logout
        </Button>
      </div>
    </Header>
  );
};

export default BranchHeader;