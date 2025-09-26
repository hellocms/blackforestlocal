import React from "react";
import { Layout, Menu, Button, Drawer, Typography } from "antd";
import { useRouter } from "next/router";
import {
  CloseOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  DeliveredProcedureOutlined,
  CreditCardOutlined,
  PictureOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  CoffeeOutlined,
  PlusCircleOutlined,
  CalculatorOutlined,
  TeamOutlined,
  ShopOutlined
} from "@ant-design/icons";

const { Sider } = Layout;
const { Title } = Typography;

// Define your menu items with navigation paths
const menuItems = [
  { key: "dashboard", label: "Dashboard", icon: <DashboardOutlined />, path: "/dashboard" },

  { key: "creating", label: "Creating", isGroup: true },
  { key: "products", label: "Products", icon: <ShoppingOutlined />, path: "/products/List" },
  { key: "pastry", label: "Barcode", icon: <CoffeeOutlined />, path: "/barcode-print" },
  { key: "categories", label: "Categories", icon: <AppstoreOutlined />, path: "/categories/List" },
  { key: "categories", label: "Departments", icon: <AppstoreOutlined />, path: "/categories/department" },
  { key: "album", label: "Album", icon: <PictureOutlined />, path: "/albums/add" },




  { key: "report", label: "Report", isGroup: true },
  { key: "billing", label: "Billing", icon: <FileTextOutlined  />, path: "/branch/BillingOrdersPage" },
  { key: "timing", label: "Timing", icon: <FileTextOutlined  />, path: "/branch/TimingReportPage" },
  { key: "waiter", label: "Waiter", icon: <FileTextOutlined  />, path: "/branch/WaiterBillsManagementPage" },
  { key: "Closingentry", label: "Closingentry", icon: <FileTextOutlined />, path: "/dealers/closing-entry/list" },
  { key: "Expense List", label: "Expense List", icon: <FileTextOutlined />, path: "/dealers/closing-entry/expenselist" },
  { key: "billing", label: "StockOrders", icon: <FileTextOutlined  />, path: "/branch/orders" },
  { key: "billing", label: "Inventory", icon: <FileTextOutlined  />, path: "/Inventory" },
  { key: "DealerBills", label: "DealerBills", icon: <FileTextOutlined />, path: "/dealers/bill-entry/list" },
  { key: "delivery", label: "Company", icon: <DeliveredProcedureOutlined />, path: "/dealers/companyForm" },
  { key: "dealer", label: "Dealer", icon: <DeliveredProcedureOutlined />, path: "/dealers/list" },
  { key: "payments", label: "FinancialManagement", icon: <CreditCardOutlined />, path: "/FinancialManagement"},


  { key: "others_2", label: "Account Creations", isGroup: true },
  { key: "branches", label: "Branches", icon: <PlusCircleOutlined />, path: "/branch/list" },
  { key: "stores", label: "registeration", icon: <ShopOutlined />, path: "/register", newTab: true },
  { key: "units", label: "User List", icon: <CalculatorOutlined />, path: "/user/List" },
  { key: "employees", label: "Employees", icon: <CalculatorOutlined />, path: "/employees/List" },
];

const Sidebar = ({ collapsed, toggleSidebar, isMobile, mobileVisible, closeMobileSidebar }) => {
  const router = useRouter();

  const handleClick = (e, path) => {
    e.preventDefault();
    router.push(path);
  };

  // Find the current selected key based on pathname
  const selectedKey = menuItems.find(item => !item.isGroup && item.path === router.pathname)?.key;

  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={220}
          style={{
            background: "#fff",
            minHeight: "100vh",
            paddingTop: "10px",
            overflowY: "auto",
            maxHeight: "100vh",
            position: "fixed",
            left: 0,
            borderRight: "1px solid #ddd"
          }}
        >
          <Menu mode="inline" style={{ borderRight: 0, background: "#fff" }} selectedKeys={[selectedKey]}>
            {menuItems.map((item) =>
              item.isGroup ? (
                <Menu.ItemGroup
                  key={item.key}
                  title={
                    collapsed
                      ? null
                      : (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#aaa",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            padding: "5px 15px"
                          }}
                        >
                          {item.label}
                        </span>
                      )
                  }
                />
              ) : (
                <Menu.Item key={item.key} icon={<span style={{ color: "#888" }}>{item.icon}</span>}>
                  {item.newTab ? (
                    <a href={item.path} target="_blank" rel="noopener noreferrer" style={{ color: "#333", textDecoration: "none" }}>
                      {item.label}
                    </a>
                  ) : (
                    <a href={item.path} onClick={(e) => handleClick(e, item.path)} style={{ color: "#333", textDecoration: "none" }}>
                      {item.label}
                    </a>
                  )}
                </Menu.Item>
              )
            )}
          </Menu>
        </Sider>
      )}

      {/* Mobile Sidebar (Drawer) */}
      <Drawer
        placement="left"
        closable={false}
        onClose={closeMobileSidebar}
        visible={mobileVisible}
        width={220}
        bodyStyle={{ padding: 0, background: "#fff" }}
      >
        {/* Mobile Sidebar Header with Close Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            background: "#fff",
            borderBottom: "1px solid #ddd"
          }}
        >
          <Title level={5} style={{ color: "#333", margin: 0 }}>
            Menu
          </Title>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={closeMobileSidebar}
            style={{
              fontSize: "18px",
              color: "#333"
            }}
          />
        </div>

        {/* Menu Items */}
        <Menu theme="light" mode="inline" selectedKeys={[selectedKey]}>
          {menuItems.map((item) =>
            item.isGroup ? (
              <Menu.ItemGroup key={item.key} title={<span style={{ fontSize: "12px", color: "#aaa", fontWeight: "bold" }}>{item.label}</span>} />
            ) : (
              <Menu.Item key={item.key} icon={<span style={{ color: "#888" }}>{item.icon}</span>}>
                {item.newTab ? (
                  <a href={item.path} target="_blank" rel="noopener noreferrer" style={{ color: "#333", textDecoration: "none" }}>
                    {item.label}
                  </a>
                ) : (
                  <a href={item.path} onClick={(e) => handleClick(e, item.path)} style={{ color: "#333", textDecoration: "none" }}>
                    {item.label}
                  </a>
                )}
              </Menu.Item>
            )
          )}
        </Menu>
      </Drawer>
    </>
  );
};

export default Sidebar;