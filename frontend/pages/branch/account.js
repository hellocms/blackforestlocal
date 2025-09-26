import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Button } from 'antd';
import { FileTextOutlined, FileDoneOutlined, DollarOutlined, BankOutlined, ShopOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import BranchHeader from '../../components/BranchHeader';

const { Title } = Typography;

const CategoryDashboard = () => {
  const [branchId, setBranchId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded.branchId) {
          setBranchId(decoded.branchId);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const handleBillingClick = () => {
    if (branchId) {
      router.push(`/branch/${branchId}`);
    } else {
      alert('Branch ID not available. Please ensure you’re logged in with a branch role.');
    }
  };

  return (
    <div
      style={{
        padding: '40px 20px',
        background: 'linear-gradient(to bottom, #f0f2f5, #e6e9f0)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ maxWidth: '1200px', width: '100%' }}>
        <BranchHeader />
        <Title
          level={2}
          style={{
            marginBottom: '40px',
            color: '#1a3042',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          Entry Dashboard
        </Title>

        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Billing"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Button
                type="default"
                size="large"
                icon={<ShopOutlined />}
                onClick={handleBillingClick}
                style={{ width: '150px' }}
              >
                Billing
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              title="Stock Entry"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Button
                type="default"
                size="large"
                icon={<FileTextOutlined />}
                href="/dealers/bill-entry/create"
                style={{ width: '150px' }}
              >
                Create
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              title="Closing Entry"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Button
                type="default"
                size="large"
                icon={<FileDoneOutlined />}
                href="/dealers/closing-entry/closingentry"
                style={{ width: '150px' }}
              >
                Create
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              title="Expense Entry"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Button
                type="default"
                size="large"
                icon={<DollarOutlined />}
                href="/dealers/expense/ExpenseEntry"
                style={{ width: '150px' }}
              >
                Create
              </Button>
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} justify="center" style={{ marginTop: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card
              title="Financial Management"
              headStyle={{ background: '#e6e9f0', fontWeight: 'bold', color: '#1a3042' }}
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Button
                type="default"
                size="large"
                icon={<BankOutlined />}
                href="/FinancialManagement"
                style={{ width: '150px' }}
              >
                Create
              </Button>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

CategoryDashboard.useLayout = false;
export default CategoryDashboard;