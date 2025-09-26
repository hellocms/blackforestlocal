import React from "react";
import { Layout } from "antd";

const { Footer } = Layout;

const AppFooter = () => {
  return (
    <Footer style={{ textAlign: "center", backgroundColor: "#001529", color: "#fff", padding: "10px" }}>
      © 2024 Blackforest CMS
    </Footer>
  );
};

export default AppFooter;
