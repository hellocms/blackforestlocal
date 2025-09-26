import React from 'react';
import { Sider } from 'antd';

const CartSidebar = ({ isCartExpanded }) => {
  return (
    <Sider
      collapsed={!isCartExpanded}
      width={400}
      trigger={null}
      style={{
        background: '#FFFFFF',
        boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.1)',
        display: isCartExpanded ? 'block' : 'none',
      }}
    >
      <div style={{ padding: '20px' }}>
        <h3>Cart Test</h3>
      </div>
    </Sider>
  );
};

export default CartSidebar;