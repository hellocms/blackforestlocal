import React, { useState, useEffect } from "react";
import { Layout, Button, Space } from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined, LogoutOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { jwtDecode as jwtDecodeLib } from "jwt-decode"; // Using named import

const { Header } = Layout;

const AppHeader = ({ collapsed, toggleSidebar, isMobile, openMobileSidebar }) => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [name, setName] = useState("Guest"); // Default to "Guest"
  const [role, setRole] = useState("User"); // Default to "User"

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);

      if (storedToken) {
        try {
          const decoded = jwtDecodeLib(storedToken);
          setName(decoded.name || "Guest"); // Use 'name' from token, fallback to "Guest"
          setRole(decoded.role || "User"); // Use 'role' from token, fallback to "User"
          console.log('Decoded Token:', decoded); // Debug log to inspect token
        } catch (error) {
          console.error('Error decoding token:', error);
          setToken(null);
          setName("Guest");
          setRole("User");
        }
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setToken(null);
    setName("Guest");
    setRole("User");
    router.push('/login');
  };

  return (
    <Header
      style={{
        background: "#000000", // Shopify black background
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: "#FFFFFF", // White text for contrast
        height: "50px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Left: App Name and Sidebar Toggle */}
      <Space align="center">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={isMobile ? openMobileSidebar : toggleSidebar}
          style={{
            fontSize: "18px",
            color: "#FFFFFF",
            marginRight: "10px",
          }}
        />
        <span style={{ fontSize: "18px", fontWeight: "bold", fontFamily: "Arial, sans-serif" }}>
          Bakery Admin
        </span>
      </Space>

      {/* Right: User Info and Logout */}
      <Space align="center">
        <span style={{ fontSize: "14px", color: "#FFFFFF" }}>
          {name} | {role} {/* Shows actual name and role, or "Guest | User" */}
        </span>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{
            fontSize: "16px",
            color: "#FFFFFF",
          }}
        >
          Logout
        </Button>
      </Space>
    </Header>
  );
};

export default AppHeader;