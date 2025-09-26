import React, { useState, useEffect } from "react";
import { Layout, Breadcrumb, theme } from "antd";
import Sidebar from "./Sidebar";
import AppHeader from "./Header";
import AppFooter from "./Footer";

const { Content } = Layout;

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} toggleSidebar={() => setCollapsed(!collapsed)} isMobile={isMobile} mobileVisible={mobileVisible} closeMobileSidebar={() => setMobileVisible(false)} />
      <Layout style={{ marginLeft: isMobile ? 0 : collapsed ? 80 : 220, transition: "margin-left 0.3s ease" }}>
        <AppHeader collapsed={collapsed} toggleSidebar={() => setCollapsed(!collapsed)} isMobile={isMobile} openMobileSidebar={() => setMobileVisible(true)} />
        <Content style={{ padding: "24px", minHeight: 280 }}>
          {children}
        </Content>
        <AppFooter />
      </Layout>
    </Layout>
  );
};

export default AppLayout;
