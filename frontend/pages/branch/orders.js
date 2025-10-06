import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { jwtDecode } from "jwt-decode";
import { Button, Table, Input, Select, DatePicker, Modal, Space, Tag, message, InputNumber, Typography } from "antd";
import { EditOutlined, EyeOutlined, PrinterOutlined, CheckCircleFilled, EyeFilled, PrinterFilled, CloseSquareFilled, TruckFilled, CheckSquareFilled, CloseCircleFilled, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;
const OrderListPage = ({ branchId }) => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [productCatalog, setProductCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]); // New: State for departments
  const [activeTab, setActiveTab] = useState("stock");
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [productFilter, setProductFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All"); // New: State for department filter
  const [kotFilterType, setKotFilterType] = useState("Department"); // New: KOT filter type
  const [dateRange, setDateRange] = useState([null, null]);
  const [dateFilterMode, setDateFilterMode] = useState("created");
  const [loading, setLoading] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [visibleModal, setVisibleModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [kotData, setKotData] = useState(null);
  const handleClearFilters = () => {
    setSearchQuery("");
    setBranchFilter("All");
    setStatusFilter("All");
    setProductFilter("All");
    setCategoryFilter("All");
    setDepartmentFilter("All"); // New: Reset department filter
    setDateRange([null, null]);
    setDateFilterMode("created");
    setKotFilterType("Department");
    message.success("Filters cleared");
  };
  const getDateRangeAndOrderIds = () => {
    if (filteredOrders.length === 0) {
      return { earliestCreated: null, latestDelivery: null, orderIds: "" };
    }
 
    const createdDates = filteredOrders
      .map((order) => order.createdAt ? dayjs(order.createdAt) : null)
      .filter(Boolean);
    const deliveryDates = filteredOrders
      .map((order) => order.deliveryDateTime ? dayjs(order.deliveryDateTime) : null)
      .filter(Boolean);
    const orderIds = filteredOrders.map((order) => order.billNo || "N/A").join(", ");
 
    const earliestCreated = createdDates.length > 0
      ? createdDates.reduce((min, date) => (date.isBefore(min) ? date : min))
      : null;
    const latestDelivery = deliveryDates.length > 0
      ? deliveryDates.reduce((max, date) => (date.isAfter(max) ? date : max))
      : null;
 
    return {
      earliestCreated: earliestCreated ? earliestCreated.format("DD/MM/YYYY") : "N/A",
      latestDelivery: latestDelivery ? latestDelivery.format("DD/MM/YYYY") : "N/A",
      orderIds,
    };
  };
  const handleSendingQtyChange = async (index, value) => {
    if (!selectedOrder) return;
 
    const updatedProducts = [...selectedOrder.products];
    updatedProducts[index].sendingQty = value !== null ? value : 0;
 
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ products: updatedProducts }),
      });
 
      if (response.ok) {
        setSelectedOrder({ ...selectedOrder, products: updatedProducts });
        setOrders((prev) =>
          prev.map((o) => (o._id === selectedOrder._id ? { ...o, products: updatedProducts } : o))
        );
        setFilteredOrders((prev) =>
          prev.map((o) => (o._id === selectedOrder._id ? { ...o, products: updatedProducts } : o))
        );
        message.success("Sending quantity updated successfully");
      } else {
        message.error("Failed to update sending quantity");
      }
    } catch (error) {
      message.error("Error updating sending quantity");
      console.error(error);
    }
  };
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || " http://localhost:5001";
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    if (!storedToken) {
      router.replace("/login");
      return;
    }
    try {
      const decoded = jwtDecode(storedToken);
      const role = decoded.role;
      if (!["admin", "superadmin"].includes(role)) {
        router.replace("/login");
        return;
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      router.replace("/login");
      return;
    }
    fetchOrders(storedToken);
    fetchBranches(storedToken);
    fetchCategories(storedToken);
    fetchProducts(storedToken);
    fetchDepartments(storedToken); // New: Fetch departments
  }, [router]);
  const fetchOrders = async (token) => {
    setLoading(true);
    try {
      const url = branchId
        ? `${BACKEND_URL}/api/orders?branchId=${branchId}`
        : `${BACKEND_URL}/api/orders`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(data);
        setFilteredOrders(data);
        const uniqueProducts = [...new Set(data.flatMap(o => o.products.map(p => p.name)))].sort();
        setProducts(uniqueProducts);
      } else {
        message.error("Failed to fetch orders");
      }
    } catch (error) {
      message.error("Error fetching orders");
      console.error(error);
    }
    setLoading(false);
  };
  const fetchBranches = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setBranches(data);
      } else {
        message.error("Failed to fetch branches");
      }
    } catch (error) {
      message.error("Error fetching branches");
      console.error(error);
    }
  };
  const fetchCategories = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/categories/list-categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setCategories(Array.isArray(data) ? data : []);
      } else {
        message.error("Failed to fetch categories");
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      message.error("Error fetching categories");
      setCategories([]);
    }
  };
  const fetchProducts = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setProductCatalog(data);
      } else {
        message.error("Failed to fetch product catalog");
      }
    } catch (error) {
      console.error("Error fetching product catalog:", error);
      message.error("Error fetching product catalog");
    }
  };
  // New: Fetch departments
  const fetchDepartments = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/departments/list-departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setDepartments(Array.isArray(data) ? data : []);
      } else {
        message.error("Failed to fetch departments");
        setDepartments([]);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      message.error("Error fetching departments");
      setDepartments([]);
    }
  };
  const fetchAssignment = async (branchId, date) => {
    try {
      const formattedDate = dayjs(date).format("YYYY-MM-DD");
      const response = await fetch(`${BACKEND_URL}/api/daily-assignments/${branchId}/by-date/${formattedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        return data;
      } else {
        console.error("Failed to fetch assignment:", data.message);
        return {};
      }
    } catch (error) {
      console.error("Error fetching assignment:", error);
      return {};
    }
  };
  useEffect(() => {
    applyFilters();
  }, [activeTab, searchQuery, branchFilter, statusFilter, productFilter, categoryFilter, departmentFilter, dateRange, dateFilterMode, orders]);
  const applyFilters = () => {
    let filtered = [...orders];
    filtered = filtered.filter((order) => order.tab === activeTab);
    if (searchQuery) {
      filtered = filtered.filter((order) =>
        order.billNo && typeof order.billNo === "string"
          ? order.billNo.toLowerCase().includes(searchQuery.toLowerCase())
          : false
      );
    }
    if (branchFilter !== "All") {
      filtered = filtered.filter((order) =>
        order.branchId && order.branchId._id === branchFilter
      );
    }
    if (statusFilter !== "All") {
      filtered = filtered.filter((order) =>
        order.status && order.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (productFilter !== "All") {
      filtered = filtered.filter((order) =>
        order.products.some((p) => p.name === productFilter)
      );
    }
    if (categoryFilter !== "All") {
      filtered = filtered.filter((order) =>
        order.products.some((p) => {
          const product = productCatalog.find(prod => prod.name === p.name);
          return product && product.category?._id === categoryFilter;
        })
      );
    }
    // New: Department filter
    if (departmentFilter !== "All") {
      filtered = filtered.filter((order) =>
        order.products.some((p) => {
          const product = productCatalog.find(prod => prod.name === p.name);
          const category = categories.find(cat => cat._id === product?.category?._id);
          return category && category.department?._id === departmentFilter;
        })
      );
    }
    if (dateRange[0]) {
      const startDate = dayjs(dateRange[0]).startOf("day");
      const endDate = dateRange[1] ? dayjs(dateRange[1]).endOf("day") : null;
      filtered = filtered.filter((order) => {
        const createdDate = order.createdAt ? dayjs(order.createdAt) : null;
        const deliveryDate = order.deliveryDateTime ? dayjs(order.deliveryDateTime) : null;
        if (dateFilterMode === "created") {
          return (
            createdDate &&
            !createdDate.isBefore(startDate) &&
            (!endDate || createdDate.isBefore(endDate))
          );
        }
        if (dateFilterMode === "delivery") {
          return (
            deliveryDate &&
            !deliveryDate.isBefore(startDate) &&
            (!endDate || deliveryDate.isBefore(endDate))
          );
        }
        if (dateFilterMode === "combined") {
          const createdMatch =
            createdDate &&
            !createdDate.isBefore(startDate) &&
            (!endDate || createdDate.isBefore(endDate));
          const deliveryMatch =
            deliveryDate &&
            !deliveryDate.isBefore(startDate) &&
            (!endDate || deliveryDate.isBefore(endDate));
          return createdMatch || deliveryMatch;
        }
        return false;
      });
    }
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setFilteredOrders(filtered);
  };
  const handleEdit = async (record) => {
    const assignment = await fetchAssignment(record.branchId._id, record.createdAt);
    setSelectedOrder({ ...record, assignment });
    setEditingOrderId(record._id);
    setIsEditMode(true);
  };
  const handleView = async (record) => {
    const assignment = await fetchAssignment(record.branchId._id, record.createdAt);
    setSelectedOrder({ ...record, assignment });
    setIsEditMode(false);
    setVisibleModal(true);
  };
  const handlePrint = async (record) => {
    const summary = {
      totalQty: record.products.reduce((sum, p) => sum + p.quantity, 0),
      totalItems: record.totalItems,
      subtotal: record.subtotal,
      sgst: record.totalGST / 2,
      cgst: record.totalGST / 2,
      totalWithGST: record.totalWithGST,
      totalWithGSTRounded: Math.round(record.totalWithGST),
      roundOff: Math.round(record.totalWithGST) - record.totalWithGST,
      paymentMethod: record.paymentMethod,
      tenderAmount: Math.round(record.totalWithGST),
      balance: 0,
    };
    const branch = branches.find((b) => b._id === (record.branchId._id || record.branchId));
    const assignment = await fetchAssignment(record.branchId._id, record.createdAt);
    printReceipt(record, summary, branch, assignment);
    message.success("Receipt printed");
  };
  const handleConfirm = async (record) => {
    const isConfirmedState = ["completed", "delivered", "received"].includes(record.status);
    const newStatus = isConfirmedState ? "pending" : "completed";
 
    if (newStatus === "completed") {
      const unconfirmedCount = record.products.filter(p => !p.confirmed).length;
      if (unconfirmedCount > 0) {
        message.error(`Cannot confirm Bill No: ${record.billNo}. ${unconfirmedCount} product(s) are not confirmed.`);
        return;
      }
    }
 
    if (["delivered", "received"].includes(record.status)) {
      message.warning("Order is already delivered or received; status cannot be reverted here.");
      return;
    }
 
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${record._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setOrders((prev) =>
          prev.map((o) => (o._id === record._id ? { ...o, status: newStatus } : o))
        );
        setFilteredOrders((prev) =>
          prev.map((o) => (o._id === record._id ? { ...o, status: newStatus } : o))
        );
        setSelectedOrder((prev) => (prev && prev._id === record._id ? { ...prev, status: newStatus } : prev));
        message.success(`Order status updated to ${newStatus}`);
      } else {
        message.error("Failed to update order status");
      }
    } catch (error) {
      message.error("Error updating order status");
      console.error(error);
    }
  };
 
  const handleDelivery = async (record) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${record._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "delivered" }),
      });
      if (response.ok) {
        setOrders((prev) =>
          prev.map((o) => (o._id === record._id ? { ...o, status: "delivered" } : o))
        );
        setFilteredOrders((prev) =>
          prev.map((o) => (o._id === record._id ? { ...o, status: "delivered" } : o))
        );
        setSelectedOrder((prev) => (prev && prev._id === record._id ? { ...prev, status: "delivered" } : prev));
        message.success("Order marked as delivered");
      } else {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        message.error(`Failed to mark as delivered: ${errorText}`);
      }
    } catch (error) {
      message.error("Error marking order as delivered");
      console.error(error);
    }
  };
 
  const handleReceived = async (record) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${record._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "received" }),
      });
      if (response.ok) {
        setOrders((prev) =>
          prev.map((o) => (o._id === record._id ? { ...o, status: "received" } : o))
        );
        setFilteredOrders((prev) =>
          prev.map((o) => (o._id === selectedOrder._id ? { ...o, status: "received" } : o))
        );
        setSelectedOrder((prev) => (prev && prev._id === record._id ? { ...prev, status: "received" } : prev));
        message.success("Order marked as received");
      } else {
        message.error("Failed to mark order as received");
      }
    } catch (error) {
      message.error("Error marking order as received");
      console.error(error);
    }
  };
  const handleToggleProductConfirm = async (productIndex) => {
    if (!selectedOrder) return;
 
    const isOrderConfirmed = ["completed", "delivered", "received"].includes(selectedOrder.status);
    if (isOrderConfirmed) {
      message.warning("Cannot change product confirmation status when order is completed, delivered, or received.");
      return;
    }
 
    const updatedProducts = [...selectedOrder.products];
    const currentConfirmed = updatedProducts[productIndex].confirmed || false;
    updatedProducts[productIndex].confirmed = !currentConfirmed;
    if (!currentConfirmed && (updatedProducts[productIndex].sendingQty === undefined || updatedProducts[productIndex].sendingQty === 0)) {
      updatedProducts[productIndex].sendingQty = updatedProducts[productIndex].quantity || 0;
    }
 
    const allConfirmed = updatedProducts.every(p => p.confirmed);
    let updatedOrder = { ...selectedOrder, products: updatedProducts };
 
    try {
      // Update products
      let response = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ products: updatedProducts }),
      });
 
      if (!response.ok) {
        message.error("Failed to update product confirmation");
        return;
      }
 
      // Fetch the updated order to ensure all fields are synced, but preserve original updatedAt
      const updatedOrderData = await response.json();
      updatedOrder = { ...updatedOrderData.order, updatedAt: selectedOrder.updatedAt };
 
      // If all products are confirmed, update order status to completed
      if (allConfirmed && !currentConfirmed) {
        response = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "completed" }),
        });
 
        if (response.ok) {
          const statusUpdateData = await response.json();
          updatedOrder = { ...updatedOrder, status: statusUpdateData.order.status, updatedAt: selectedOrder.updatedAt };
          message.success("All products confirmed, order status updated to completed");
        } else {
          message.error("Failed to update order status to completed");
          return;
        }
      }
 
      setSelectedOrder(updatedOrder);
      setOrders((prev) =>
        prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...updatedOrder } : o))
      );
      setFilteredOrders((prev) =>
        prev.map((o) => (o._id === selectedOrder._id ? { ...o, ...updatedOrder } : o))
      );
      message.success(`Product ${currentConfirmed ? "unconfirmed" : "confirmed"} successfully`);
    } catch (error) {
      message.error("Error updating product confirmation");
      console.error(error);
    }
  };
  const getKOTData = () => {
    const isAllBranches = branchFilter === "All";
    if (kotFilterType === "Branch") {
      const categoryMap = {};
      filteredOrders.forEach((order) => {
        const branchPrefix = order.branchId?.name?.slice(0, 3).toUpperCase() || "UNK";
        const branchFullName = order.branchId?.name || "Unknown";
        order.products
          .filter((product) => {
            const catalogProduct = productCatalog.find((p) => p.name === product.name);
            if (!catalogProduct) return false;
            const categoryId = catalogProduct.category?._id;
            if (!categoryId) return false;
            const category = categories.find((cat) => cat._id === categoryId);
            if (!category) return false;
            if (departmentFilter !== "All" && category.department?._id !== departmentFilter) return false;
            if (categoryFilter !== "All" && categoryId !== categoryFilter) return false;
            if (productFilter !== "All" && product.name !== productFilter) return false;
            return true;
          })
          .forEach((product) => {
            const catalogProduct = productCatalog.find((p) => p.name === product.name);
            const categoryId = catalogProduct.category?._id;
            const categoryName = categories.find((c) => c._id === categoryId)?.name || "Unknown";
            if (!categoryMap[categoryId]) {
              categoryMap[categoryId] = {
                name: categoryName,
                branches: isAllBranches ? {} : null,
                products: !isAllBranches ? {} : null,
              };
            }
            const cat = categoryMap[categoryId];
            const prodQty = product.quantity || 0;
            const unitPrice = product.price || 0;
            const prodTotalPrice = prodQty * unitPrice;
            const productKey = product.name;
            if (isAllBranches) {
              if (!cat.branches[branchPrefix]) {
                cat.branches[branchPrefix] = {
                  name: branchFullName,
                  products: {},
                };
              }
              const br = cat.branches[branchPrefix];
              if (!br.products[productKey]) {
                br.products[productKey] = { qty: 0, totalPrice: 0, unit: product.unit || "", unitPrice };
              }
              br.products[productKey].qty += prodQty;
              br.products[productKey].totalPrice += prodTotalPrice;
            } else {
              if (!cat.products[productKey]) {
                cat.products[productKey] = { qty: 0, totalPrice: 0, unit: product.unit || "", unitPrice };
              }
              cat.products[productKey].qty += prodQty;
              cat.products[productKey].totalPrice += prodTotalPrice;
            }
          });
      });
      const categoriesData = Object.values(categoryMap).sort((a, b) => a.name.localeCompare(b.name));
      const hasData = categoriesData.some((cat) =>
        isAllBranches
          ? Object.values(cat.branches || {}).some((br) => Object.keys(br.products || {}).length > 0)
          : Object.keys(cat.products || {}).length > 0
      );
      return { type: "Branch", categories: categoriesData, isAllBranches, hasData };
    } else { // "Department"
      const deptMap = {};
      filteredOrders.forEach((order) => {
        order.products
          .filter((product) => {
            const catalogProduct = productCatalog.find((p) => p.name === product.name);
            if (!catalogProduct) return false;
            const categoryId = catalogProduct.category?._id;
            if (!categoryId) return false;
            const category = categories.find((cat) => cat._id === categoryId);
            if (!category) return false;
            const deptId = category.department?._id;
            if (departmentFilter !== "All" && deptId !== departmentFilter) return false;
            if (categoryFilter !== "All" && categoryId !== categoryFilter) return false;
            if (productFilter !== "All" && product.name !== productFilter) return false;
            return true;
          })
          .forEach((product) => {
            const catalogProduct = productCatalog.find((p) => p.name === product.name);
            const categoryId = catalogProduct.category?._id;
            const category = categories.find((cat) => cat._id === categoryId);
            const deptId = category?.department?._id;
            const deptName = departments.find((d) => d._id === deptId)?.name || "Unknown";
            const categoryName = category?.name || "Unknown";
            if (!deptMap[deptId]) {
              deptMap[deptId] = {
                name: deptName,
                categories: {},
              };
            }
            const dept = deptMap[deptId];
            if (!dept.categories[categoryId]) {
              dept.categories[categoryId] = {
                name: categoryName,
                products: {},
              };
            }
            const cat = dept.categories[categoryId];
            const prodKey = product.name;
            const prodQty = product.quantity || 0;
            const unitPrice = product.price || 0;
            const prodTotalPrice = prodQty * unitPrice;
            if (!cat.products[prodKey]) {
              cat.products[prodKey] = { qty: 0, totalPrice: 0, unit: product.unit || "", unitPrice };
            }
            cat.products[prodKey].qty += prodQty;
            cat.products[prodKey].totalPrice += prodTotalPrice;
          });
      });
      const departmentsData = Object.values(deptMap).sort((a, b) => a.name.localeCompare(b.name));
      const hasData = departmentsData.some((dept) =>
        Object.values(dept.categories || {}).some((cat) => Object.keys(cat.products || {}).length > 0)
      );
      return { type: "Department", departments: departmentsData, hasData };
    }
  };
  const handlePreview = async () => {
    const kotResult = getKOTData();
    if (!kotResult.hasData) {
      const branchName = branchFilter === "All" ? "all branches" : branches.find((b) => b._id === branchFilter)?.name || branchFilter;
      const departmentName = departmentFilter === "All" ? "all departments" : departments.find((d) => d._id === departmentFilter)?.name || departmentFilter;
      const categoryName = categoryFilter === "All" ? "all categories" : categories.find((c) => c._id === categoryFilter)?.name || categoryFilter;
      const productName = productFilter === "All" ? "all products" : productFilter;
      message.info(`No ${statusFilter} orders found for ${departmentName}, ${categoryName}, and ${productName} in ${branchName}.`);
      return;
    }
    setKotData(kotResult);
    const updatedOrders = await Promise.all(
      filteredOrders.map(async (order) => {
        const assignment = await fetchAssignment(order.branchId?._id, order.createdAt);
        return { ...order, assignment };
      })
    );
    setFilteredOrders(updatedOrders);
    setPreviewModalVisible(true);
  };
  const handlePrintCombined = () => {
    const kotResult = getKOTData();
    if (!kotResult.hasData) {
      const branchName = branchFilter === "All" ? "all branches" : branches.find((b) => b._id === branchFilter)?.name || branchFilter;
      const departmentName = departmentFilter === "All" ? "all departments" : departments.find((d) => d._id === departmentFilter)?.name || departmentFilter;
      const categoryName = categoryFilter === "All" ? "all categories" : categories.find((c) => c._id === categoryFilter)?.name || categoryFilter;
      const productName = productFilter === "All" ? "all products" : productFilter;
      message.info(`No ${statusFilter} orders found for ${departmentName}, ${categoryName}, and ${productName} in ${branchName}.`);
      return;
    }
    const { earliestCreated, latestDelivery, orderIds } = getDateRangeAndOrderIds();
    const printWindow = window.open("", "_blank");
    const currentDate = dayjs().format("DD/MM/YYYY");
    const branchTitle = branchFilter === "All" ? "All Branches" : branches.find((b) => b._id === branchFilter)?.name?.slice(0, 3).toUpperCase() || branchFilter;
    const departmentTitle = departmentFilter === "All" ? "All Departments" : departments.find((d) => d._id === departmentFilter)?.name || departmentFilter;
    const categoryTitle = categoryFilter === "All" ? "All Categories" : categories.find((c) => c._id === categoryFilter)?.name || categoryFilter;
    const productTitle = productFilter === "All" ? "All Products" : productFilter;
    const reportTitle = kotFilterType === "Branch" ? "KOT Report" : "KOT Report by Department";
    if (kotResult.type === "Branch") {
      printWindow.document.write(`
        <html>
          <head>
            <title>KOT Report</title>
            <style>
              body { font-family: 'Courier New', monospace; width: 302px; margin: 0; padding: 5px; font-size: 10px; line-height: 1.2; }
              h2 { text-align: center; font-size: 14px; font-weight: bold; margin: 0 0 5px 0; }
              h3 { text-align: center; font-size: 12px; font-weight: bold; margin: 5px 0 3px 0; }
              h4 { text-align: center; font-size: 11px; font-weight: bold; margin: 3px 0 2px 0; }
              p { margin: 2px 0; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin: 2px 0; }
              th, td { padding: 2px; text-align: left; font-size: 10px; border: 1px solid #d9d9d9; }
              th { font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 5px 0; }
              @media print { @page { margin: 0; size: 80mm auto; } body { margin: 0; padding: 5px; } }
            </style>
          </head>
          <body>
            <h2>${reportTitle} - ${branchTitle} (${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)})</h2>
            <p>Order IDs: ${orderIds}</p>
            <p>Department: ${departmentTitle}</p>
            <p>Category: ${categoryTitle}</p>
            <p>Product: ${productTitle}</p>
            <p>Created Date: ${earliestCreated}</p>
            <p>Delivery Date: ${latestDelivery}</p>
            <p>Date: ${currentDate}</p>
            <div class="divider"></div>
            ${kotResult.categories
              .map(
                (cat) => `
                  <h3>${cat.name}</h3>
                  ${
                    kotResult.isAllBranches
                      ? Object.entries(cat.branches)
                          .sort(([a, brA], [b, brB]) => brA.name.localeCompare(brB.name))
                          .map(
                            ([bPrefix, br]) => `
                              <h4>${br.name}</h4>
                              <table>
                                <thead>
                                  <tr>
                                    <th style="width: 50%;">Product Name</th>
                                    <th style="width: 15%; text-align: right;">Qty</th>
                                    <th style="width: 15%; text-align: right;">Rate</th>
                                    <th style="width: 20%; text-align: right;">Total ₹</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${Object.entries(br.products)
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .map(
                                      ([pName, pData]) => `
                                        <tr>
                                          <td><strong>${pName}${pData.unit ? ` ${pData.unit}` : ''}</strong></td>
                                          <td style="text-align: right;">${pData.qty}</td>
                                          <td style="text-align: right;">₹${(pData.unitPrice || 0).toFixed(2)}</td>
                                          <td style="text-align: right;">${pData.totalPrice.toFixed(2)}</td>
                                        </tr>
                                      `
                                    )
                                    .join("")}
                                  <tr style="font-weight: bold; background-color: #f0f0f0;">
                                    <td>Branch Subtotal</td>
                                    <td style="text-align: right;">${Object.values(br.products).reduce(
                                      (s, p) => s + p.qty,
                                      0
                                    )}</td>
                                    <td></td>
                                    <td style="text-align: right;">${Object.values(br.products).reduce(
                                      (s, p) => s + p.totalPrice,
                                      0
                                    ).toFixed(2)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            `
                          )
                          .join("")
                      : `
                          <table>
                            <thead>
                              <tr>
                                <th style="width: 50%;">Product Name</th>
                                <th style="width: 15%; text-align: right;">Qty</th>
                                <th style="width: 15%; text-align: right;">Rate</th>
                                <th style="width: 20%; text-align: right;">Total ₹</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${Object.entries(cat.products)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(
                                  ([pName, pData]) => `
                                    <tr>
                                      <td><strong>${pName}${pData.unit ? ` ${pData.unit}` : ''}</strong></td>
                                      <td style="text-align: right;">${pData.qty}</td>
                                      <td style="text-align: right;">₹${(pData.unitPrice || 0).toFixed(2)}</td>
                                      <td style="text-align: right;">${pData.totalPrice.toFixed(2)}</td>
                                    </tr>
                                  `
                                )
                                .join("")}
                              <tr style="font-weight: bold; background-color: #f0f0f0;">
                                <td>Category Total</td>
                                <td style="text-align: right;">${Object.values(cat.products).reduce(
                                  (s, p) => s + p.qty,
                                  0
                                )}</td>
                                <td></td>
                                <td style="text-align: right;">${Object.values(cat.products).reduce(
                                  (s, p) => s + p.totalPrice,
                                  0
                                ).toFixed(2)}</td>
                              </tr>
                            </tbody>
                          </table>
                        `
                  }
                  ${
                    kotResult.isAllBranches
                      ? `
                          <div style="border-top: 1px dashed #000; margin: 5px 0;">
                            <p style="text-align: right; font-weight: bold;">Category Grand Total: ₹${Object.values(
                              cat.branches
                            )
                              .reduce((sumBr, br) => sumBr + Object.values(br.products).reduce((sumP, p) => sumP + p.totalPrice, 0), 0)
                              .toFixed(2)}</p>
                          </div>
                        `
                      : ""
                  }
                `
              )
              .join("")}
            <div class="divider"></div>
            <p>Generated by [App Name] on ${currentDate}</p>
          </body>
        </html>
      `);
    } else { // Department
      printWindow.document.write(`
        <html>
          <head>
            <title>KOT Report</title>
            <style>
              body { font-family: 'Courier New', monospace; width: 302px; margin: 0; padding: 5px; font-size: 10px; line-height: 1.2; }
              h2 { text-align: center; font-size: 14px; font-weight: bold; margin: 0 0 5px 0; }
              h3 { text-align: center; font-size: 12px; font-weight: bold; margin: 5px 0 3px 0; }
              h4 { text-align: center; font-size: 11px; font-weight: bold; margin: 3px 0 2px 0; }
              p { margin: 2px 0; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin: 2px 0; }
              th, td { padding: 2px; text-align: left; font-size: 10px; border: 1px solid #d9d9d9; }
              th { font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 5px 0; }
              @media print { @page { margin: 0; size: 80mm auto; } body { margin: 0; padding: 5px; } }
            </style>
          </head>
          <body>
            <h2>${reportTitle} - ${branchTitle} (${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)})</h2>
            <p>Order IDs: ${orderIds}</p>
            <p>Department: ${departmentTitle}</p>
            <p>Category: ${categoryTitle}</p>
            <p>Product: ${productTitle}</p>
            <p>Created Date: ${earliestCreated}</p>
            <p>Delivery Date: ${latestDelivery}</p>
            <p>Date: ${currentDate}</p>
            <div class="divider"></div>
            ${kotResult.departments
              .map(
                (dept) => `
                  <h3>${dept.name}</h3>
                  ${Object.entries(dept.categories)
                    .sort(([_, catA], [__, catB]) => catA.name.localeCompare(catB.name))
                    .map(
                      ([catId, cat]) => `
                        <h4>${cat.name}</h4>
                        <table>
                          <thead>
                            <tr>
                              <th style="width: 50%;">Product Name</th>
                              <th style="width: 15%; text-align: right;">Qty</th>
                              <th style="width: 15%; text-align: right;">Rate</th>
                              <th style="width: 20%; text-align: right;">Total ₹</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${Object.entries(cat.products)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(
                                ([pName, pData]) => `
                                  <tr>
                                    <td><strong>${pName}${pData.unit ? ` ${pData.unit}` : ''}</strong></td>
                                    <td style="text-align: right;">${pData.qty}</td>
                                    <td style="text-align: right;">₹${(pData.unitPrice || 0).toFixed(2)}</td>
                                    <td style="text-align: right;">${pData.totalPrice.toFixed(2)}</td>
                                  </tr>
                                `
                              )
                              .join("")}
                            <tr style="font-weight: bold; background-color: #f0f0f0;">
                              <td>Category Total</td>
                              <td style="text-align: right;">${Object.values(cat.products).reduce(
                                (s, p) => s + p.qty,
                                0
                              )}</td>
                              <td></td>
                              <td style="text-align: right;">${Object.values(cat.products).reduce(
                                (s, p) => s + p.totalPrice,
                                0
                              ).toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      `
                    )
                    .join("")}
                  <div style="border-top: 1px dashed #000; margin: 5px 0;">
                    <p style="text-align: right; font-weight: bold;">Department Total: ₹${Object.values(dept.categories)
                      .reduce((sumCat, cat) => sumCat + Object.values(cat.products).reduce((sumP, p) => sumP + p.totalPrice, 0), 0)
                      .toFixed(2)}</p>
                  </div>
                `
              )
              .join("")}
            <div class="divider"></div>
            <p>Generated by [App Name] on ${currentDate}</p>
          </body>
        </html>
      `);
    }
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };
  const columns = [
    { title: "Serial No", render: (_, __, index) => index + 1, width: 80 },
    {
      title: "Bill No",
      dataIndex: "billNo",
      sorter: (a, b) => (a.billNo || "").localeCompare(b.billNo || ""),
      width: 80,
      render: (billNo) => billNo || "N/A",
    },
    {
      title: "Branch",
      dataIndex: "branchId",
      render: (branchId) => branchId?.name?.split(' ').slice(0, 2).join(' ') || "Unknown Branch",
      width: 150,
    },
    { title: "Total Items", dataIndex: "totalItems", width: 100 },
    {
      title: "Completed Items",
      render: (record) => record.totalItems - record.products.filter(p => !p.confirmed).length,
      width: 120,
    },
    {
      title: "Pending Items",
      render: (record) => record.products.filter(p => !p.confirmed).length,
      width: 120,
    },
    {
      title: "Ordered Amount",
      dataIndex: "totalWithGST",
      render: (value) => `₹${(value || 0).toFixed(2)}`,
      sorter: (a, b) => (a.totalWithGST || 0) - (b.totalWithGST || 0),
      width: 120,
    },
    {
      title: "Sending Value",
      render: (record) => `₹${record.products.reduce((sum, p) => sum + (p.sendingQty || 0) * (p.price || 0), 0).toFixed(2)}`,
      width: 120,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => (
        <Tag
          color={
            value === "completed"
              ? "green"
              : value === "pending"
              ? "yellow"
              : value === "neworder"
              ? "blue"
              : value === "delivered"
              ? "purple"
              : value === "received"
              ? "cyan"
              : "orange"
          }
        >
          {value || "Unknown"}
        </Tag>
      ),
      width: 100,
    },
    {
      title: "Actions",
      render: (record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button icon={<EyeOutlined />} onClick={() => handleView(record)} />
          <Button icon={<PrinterOutlined />} onClick={() => handlePrint(record)} />
        </Space>
      ),
      width: 150,
    },
  ];
  const printReceipt = (order, summary, branch, assignment) => {
    const {
      totalQty,
      totalItems,
      subtotal,
      sgst,
      cgst,
      totalWithGST,
      totalWithGSTRounded,
      roundOff,
      paymentMethod,
      tenderAmount,
      balance,
    } = summary;
    const printWindow = window.open("", "_blank");
   
    const createdDate = order.createdAt
      ? dayjs(order.createdAt).tz("Asia/Kolkata").format("DD/MM/YYYY")
      : "N/A";
    const deliveryDate = order.deliveryDateTime
      ? dayjs(order.deliveryDateTime).tz("Asia/Kolkata").format("DD/MM/YYYY")
      : "N/A";
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 302px; margin: 0; padding: 5px; font-size: 10px; line-height: 1.2; }
            h2 { text-align: center; font-size: 14px; font-weight: bold; margin: 0 0 5px 0; }
            p { margin: 2px 0; overflow: hidden; text-overflow: ellipsis; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th, td { padding: 2px; text-align: left; font-size: 10px; border: 1px solid #d9d9d9; }
            th { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .summary { margin-top: 5px; }
            .summary div { display: flex; justify-content: space-between; }
            .payment-details { margin-top: 5px; }
            @media print { @page { margin: 0; size: 80mm auto; } body { margin: 0; padding: 5px; } }
          </style>
        </head>
        <body>
          <h2>${branch?.name?.slice(0, 3).toUpperCase() || order.branchId?.name?.slice(0, 3).toUpperCase() || "Unknown Branch"}</h2>
          <p style="text-align: center;">${branch?.address || "Address Not Available"}</p>
          <p style="text-align: center;">${branch?.phoneNo || "Phone Not Available"}</p>
          <p style="text-align: center;">Bill No: ${order.billNo || "N/A"}</p>
          <p style="text-align: center;">Waiter: ${order.waiterId?.name || "N/A"}</p>
          <p style="text-align: center;">Manager: ${assignment.managerId?.name || "N/A"} | Cashier: ${assignment.cashierId?.name || "N/A"}</p>
          <p style="text-align: center;">Created: ${createdDate}</p>
          <p style="text-align: center;">Delivery: ${deliveryDate}</p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th style="width: 10%;">SL</th>
                <th style="width: 45%;">Description</th>
                <th style="width: 15%;">MRP</th>
                <th style="width: 10%;">Qty</th>
                <th style="width: 20%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${
                order.products && Array.isArray(order.products)
                  ? order.products
                      .map(
                        (product, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${product.name || "Unknown"} (${product.quantity || 0}${product.unit || ""})
                  </td>
                  <td>₹${(product.price || 0).toFixed(2)}</td>
                  <td>${product.quantity || 0}</td>
                  <td>₹${(product.productTotal || 0).toFixed(2)}</td>
                </tr>
              `
                      )
                      .join("")
                  : "<tr><td colspan='5'>No products</td></tr>"
              }
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="summary">
            <div><span>Tot Qty:</span><span>${totalQty.toFixed(2)}</span></div>
            <div><span>Tot Items:</span><span>${totalItems}</span></div>
            <div><span>Total Amount:</span><span>₹${subtotal.toFixed(2)}</span></div>
            <div><span>SGST:</span><span>₹${sgst.toFixed(2)}</span></div>
            <div><span>CGST:</span><span>₹${cgst.toFixed(2)}</span></div>
            <div><span>Round Off:</span><span>${roundOff >= 0 ? "+" : ""}${roundOff.toFixed(2)}</span></div>
            <div><span>Net Amt:</span><span>${totalWithGSTRounded.toFixed(2)}</span></div>
          </div>
          <div class="payment-details">
            <p>Payment Details:</p>
            <p>${
              paymentMethod ? paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1) : "N/A"
            } - ₹${totalWithGSTRounded.toFixed(2)}</p>
            <p>Tender: ₹${tenderAmount.toFixed(2)}</p>
            <p>Balance: ₹${balance.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };
  const editModalColumns = [
    {
      title: "Product Name",
      dataIndex: "name",
      render: (text) => <strong>{text}</strong>,
    },
    { title: "Required Qty", dataIndex: "quantity" },
    { title: "Stock", dataIndex: "bminstock" },
    {
      title: "Sending Qty",
      dataIndex: "sendingQty",
      render: (text, record, index) => (
        <Space.Compact style={{ width: '100%' }}>
          <InputNumber
            min={0}
            value={
              !["completed", "delivered", "received"].includes(selectedOrder.status) && !record.confirmed
                ? record.quantity
                : text !== undefined ? text : 0
            }
            onChange={(value) => handleSendingQtyChange(index, value)}
            style={{
              width: '60px',
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderRight: 'none',
            }}
          />
          <Button
            type="primary"
            icon={<CheckCircleFilled />}
            danger={!record.confirmed}
            disabled={["completed", "delivered", "received"].includes(selectedOrder.status)}
            style={{
              backgroundColor: record.confirmed ? "#52c41a" : "#ff4d4f",
              borderColor: record.confirmed ? "#52c41a" : "#ff4d4f",
              color: "#fff",
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              padding: '4px 8px',
              height: '32px',
            }}
            onClick={() => handleToggleProductConfirm(index)}
          />
        </Space.Compact>
      ),
      width: 100,
    },
    {
      title: "Difference",
      render: (record) => (
        record.sendingQty !== undefined && record.quantity !== undefined && record.sendingQty !== record.quantity ? (
          record.sendingQty > record.quantity ? (
            <span style={{ color: 'green' }}>
              ↑ {record.sendingQty - record.quantity}
            </span>
          ) : (
            <span style={{ color: 'red' }}>
              ↓ {record.quantity - record.sendingQty}
            </span>
          )
        ) : null
      ),
      width: 80,
    },
    { title: "Unit", dataIndex: "unit" },
    {
      title: "Price",
      dataIndex: "price",
      render: (text) => `₹${(text || 0).toFixed(2)}`,
    },
    {
      title: "Total",
      render: (record) => `₹${((record.sendingQty || 0) * (record.price || 0)).toFixed(2)}`,
    },
    {
      title: "Order Date",
      render: () => selectedOrder.createdAt ? (
        <div style={{ lineHeight: '1.2', whiteSpace: 'pre-line' }}>
          {dayjs(selectedOrder.createdAt).tz("Asia/Kolkata").format("DD/MM/YYYY")}
          {`\n${dayjs(selectedOrder.createdAt).tz("Asia/Kolkata").format("hh:mm A")}`}
        </div>
      ) : "N/A",
      width: 150,
    },
    {
      title: "Delivery Date",
      render: () => selectedOrder.deliveryDateTime ? (
        <div style={{ lineHeight: '1.2', whiteSpace: 'pre-line' }}>
          {dayjs(selectedOrder.deliveryDateTime).tz("Asia/Kolkata").format("DD/MM/YYYY")}
          {`\n${dayjs(selectedOrder.deliveryDateTime).tz("Asia/Kolkata").format("hh:mm A")}`}
        </div>
      ) : "N/A",
      width: 150,
    },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
      render: (value) => value ? (
        <div style={{ lineHeight: '1.2', whiteSpace: 'pre-line' }}>
          {dayjs(value).tz("Asia/Kolkata").format("DD/MM/YYYY")}
          {`\n${dayjs(value).tz("Asia/Kolkata").format("hh:mm A")}`}
        </div>
      ) : "N/A",
      width: 150,
    },
  ];
  const viewModalColumns = [
    { title: "Product", dataIndex: "name", render: (value) => value || "Unknown" },
    {
      title: "Required Qty",
      dataIndex: "quantity",
      render: (value) => value || 0
    },
    {
      title: "BMinStock",
      dataIndex: "bminstock",
      render: (value) => value ?? "N/A"
    },
    {
      title: "Sending Qty",
      dataIndex: "sendingQty",
      render: (value, record) => (
        <Space>
          <span>{value || 0}</span>
          {value !== undefined && record.quantity !== undefined && value !== record.quantity && (
            value > record.quantity ? (
              <span style={{ color: 'green' }}>
                [↑ {value - record.quantity}]
              </span>
            ) : (
              <span style={{ color: 'red' }}>
                [↓ {record.quantity - value}]
              </span>
            )
          )}
        </Space>
      ),
    },
    { title: "Unit", dataIndex: "unit", render: (value) => value || "" },
    { title: "Price", dataIndex: "price", render: (value) => `₹${(value || 0).toFixed(2)}` },
    {
      title: "Total",
      render: (record) => `₹${((record.sendingQty || 0) * (record.price || 0)).toFixed(2)}`
    },
    {
      title: "Confirm",
      dataIndex: "confirmed",
      render: (value) => (
        <Tag color={value ? "green" : "red"}>{value ? "Confirmed" : "Pending"}</Tag>
      ),
    },
  ];
  const calculateTotals = (products) => {
    return {
      quantity: products.reduce((sum, p) => sum + (p.quantity || 0), 0),
      bminstock: products.reduce((sum, p) => sum + (p.bminstock || 0), 0) || "N/A",
      sendingQty: products.reduce((sum, p) => sum + (p.sendingQty || 0), 0),
      price: products.reduce((sum, p) => sum + (p.price || 0), 0),
      total: products.reduce((sum, p) => sum + ((p.sendingQty || 0) * (p.price || 0)), 0),
    };
  };
  const modalFooter = (products) => {
    const totals = calculateTotals(products || []);
    return (
      <tr style={{ fontWeight: "bold" }}>
        <td style={{ border: "1px solid #d9d9d9" }}>Total</td>
        <td style={{ border: "1px solid #d9d9d9" }}>{totals.quantity}</td>
        <td style={{ border: "1px solid #d9d9d9" }}>{totals.bminstock}</td>
        <td style={{ border: "1px solid #d9d9d9" }}>{totals.sendingQty}</td>
        <td style={{ border: "1px solid #d9d9d9" }}>N/A</td>
        <td style={{ border: "1px solid #d9d9d9" }}>₹{totals.price.toFixed(2)}</td>
        <td style={{ border: "1px solid #d9d9d9" }}>₹{totals.total.toFixed(2)}</td>
      </tr>
    );
  };
  const tableSummary = () => {
    const totalItems = filteredOrders.reduce((sum, o) => sum + (o.totalItems || 0), 0);
    const totalCompleted = filteredOrders.reduce((sum, o) => sum + (o.totalItems - o.products.filter(p => !p.confirmed).length), 0);
    const totalPending = filteredOrders.reduce((sum, o) => sum + o.products.filter(p => !p.confirmed).length, 0);
    const totalOrdered = filteredOrders.reduce((sum, o) => sum + (o.totalWithGST || 0), 0);
    const totalSending = filteredOrders.reduce((sum, o) => sum + o.products.reduce((s, p) => s + (p.sendingQty || 0) * (p.price || 0), 0), 0);
    return (
      <Table.Summary.Row>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>Total</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }} />
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }} />
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>{totalItems}</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>{totalCompleted}</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>{totalPending}</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>₹{totalOrdered.toFixed(2)}</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>₹{totalSending.toFixed(2)}</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }} />
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }} />
      </Table.Summary.Row>
    );
  };
  const viewModalSummary = () => {
    if (!selectedOrder || !selectedOrder.products) return null;
    const totals = calculateTotals(selectedOrder.products);
    return (
      <Table.Summary.Row>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>Total</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>{totals.quantity}</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>{totals.bminstock}</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>{totals.sendingQty}</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>N/A</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>₹{totals.price.toFixed(2)}</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>₹{totals.total.toFixed(2)}</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }} />
      </Table.Summary.Row>
    );
  };
  const editSummary = () => {
    if (!selectedOrder || !selectedOrder.products) return null;
    const totals = calculateTotals(selectedOrder.products);
    return (
      <Table.Summary.Row>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>Total</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>{totals.quantity}</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>{totals.bminstock}</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>{totals.sendingQty}</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>N/A</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>N/A</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>₹{totals.price.toFixed(2)}</Table.Summary.Cell>
        <Table.Summary.Cell style={{ border: "1px solid #d9d9d9" }}>₹{totals.total.toFixed(2)}</Table.Summary.Cell>
      </Table.Summary.Row>
    );
  };
  const kotProductColumns = [
    {
      title: "Product Name",
      dataIndex: "name",
      render: (_, record) => <strong>{`${record.name}${record.unit ? ` ${record.unit}` : ''}`}</strong>,
    },
    {
      title: "Qty",
      dataIndex: "qty",
      align: "right",
    },
    {
      title: "Rate",
      dataIndex: "unitPrice",
      render: (value) => `₹${(value || 0).toFixed(2)}`,
      align: "right",
    },
    {
      title: "Total",
      dataIndex: "totalPrice",
      render: (value) => `₹${value.toFixed(2)}`,
      align: "right",
    },
  ];
  return (
    <div style={{ padding: "20px" }}>
      <Space direction="vertical" style={{ width: "100%", marginBottom: "20px" }}>
        <Space wrap style={{ marginBottom: "10px" }}>
          <Space direction="vertical">
            <Text strong>Order Type:</Text>
            <Space>
              <Button
                type={activeTab === "stock" ? "primary" : "default"}
                onClick={() => setActiveTab("stock")}
              >
                Stock Orders
              </Button>
              <Button
                type={activeTab === "liveOrder" ? "primary" : "default"}
                onClick={() => setActiveTab("liveOrder")}
              >
                Live Orders
              </Button>
            </Space>
          </Space>
          <Space direction="vertical">
            <Text strong>Status:</Text>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            >
              <Option value="All">All</Option>
              <Option value="neworder">New Order</Option>
              <Option value="pending">Pending</Option>
              <Option value="completed">Completed</Option>
              <Option value="delivered">Delivered</Option>
              <Option value="received">Received</Option>
              <Option value="draft">Draft</Option>
            </Select>
          </Space>
          <Space direction="vertical">
            <Text strong>Search Bill No:</Text>
            <Input
              placeholder="Enter Bill No"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 200 }}
            />
          </Space>
          <Space direction="vertical">
            <Text strong>Branch:</Text>
            <Select
              value={branchFilter}
              onChange={setBranchFilter}
              style={{ width: 200 }}
              placeholder="Select Branch"
            >
              <Option value="All">All Branches</Option>
              {branches.map((branch) => (
                <Option key={branch._id} value={branch._id}>
                  {branch.name}
                </Option>
              ))}
            </Select>
          </Space>
          <Space direction="vertical">
            <Text strong>Date Range:</Text>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates || [null, null])}
              style={{ width: 250 }}
            />
          </Space>
          <Space direction="vertical">
            <Text strong>Date Filter Mode:</Text>
            <Select
              value={dateFilterMode}
              onChange={setDateFilterMode}
              style={{ width: 150 }}
            >
              <Option value="created">Created Date</Option>
              <Option value="delivery">Delivery Date</Option>
              <Option value="combined">Combined</Option>
            </Select>
          </Space>
        </Space>
        <Space wrap style={{ marginBottom: "10px" }}>
          <Space direction="vertical">
            <Text strong>Category:</Text>
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: 200 }}
              placeholder="Select Category"
            >
              <Option value="All">All Categories</Option>
              {categories.map((category) => (
                <Option key={category._id} value={category._id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Space>
          <Space direction="vertical">
            <Text strong>Product:</Text>
            <Select
              value={productFilter}
              onChange={setProductFilter}
              style={{ width: 200 }}
              placeholder="Select Product"
            >
              <Option value="All">All Products</Option>
              {products.map((product) => (
                <Option key={product} value={product}>
                  {product}
                </Option>
              ))}
            </Select>
          </Space>
          <Space direction="vertical">
            <Text strong>Department:</Text>
            <Select
              value={departmentFilter}
              onChange={setDepartmentFilter}
              style={{ width: 200 }}
              placeholder="Select Department"
            >
              <Option value="All">All Departments</Option>
              {departments.map((department) => (
                <Option key={department._id} value={department._id}>
                  {department.name}
                </Option>
              ))}
            </Select>
          </Space>
          <Space direction="vertical">
            <Text strong>KOT Type:</Text>
            <Space>
              <Select value={kotFilterType} onChange={setKotFilterType} style={{ width: 120 }}>
                <Option value="Branch">By Branch</Option>
                <Option value="Department">By Department</Option>
              </Select>
              <Button
                type="primary"
                icon={<EyeFilled />}
                onClick={handlePreview}
                style={{ width: 32, height: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
              />
              <Button
                type="primary"
                icon={<PrinterFilled />}
                onClick={handlePrintCombined}
                style={{ width: 32, height: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
              />
              <Button
                type="primary"
                icon={<CloseSquareFilled />}
                onClick={handleClearFilters}
                style={{ width: 32, height: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
              />
            </Space>
          </Space>
        </Space>
        <Table
          columns={columns}
          dataSource={filteredOrders}
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowKey="_id"
          scroll={{ x: 1400 }}
          summary={tableSummary}
          bordered
          size="small"
        />
        {editingOrderId && selectedOrder && (
          <div style={{ marginTop: 20, border: "1px solid #d9d9d9", padding: 16, position: "relative" }}>
            <Button
              type="text"
              icon={<CloseCircleFilled style={{ color: "red", fontSize: 24 }} />}
              style={{ position: "absolute", top: 8, right: 8 }}
              onClick={() => { setEditingOrderId(null); setSelectedOrder(null); }}
            />
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <span style={{ marginRight: 16 }}>
                Order {selectedOrder.billNo || "N/A"} - {selectedOrder.branchId?.name?.slice(0, 3).toUpperCase() || "UNK"} (
                {selectedOrder.status || "Unknown"})
              </span>
              <Button
                type="primary"
                icon={<CheckCircleFilled />}
                disabled={!["pending", "neworder", "draft"].includes(selectedOrder.status) && !["completed", "delivered", "received"].includes(selectedOrder.status)}
                danger={!["completed", "delivered", "received"].includes(selectedOrder.status)}
                style={{
                  backgroundColor: ["completed", "delivered", "received"].includes(selectedOrder.status) ? "#52c41a" : "#ff4d4f",
                  borderColor: ["completed", "delivered", "received"].includes(selectedOrder.status) ? "#52c41a" : "#ff4d4f",
                  marginRight: 8,
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  color: "#fff",
                }}
                onClick={() => handleConfirm(selectedOrder)}
              >
                {selectedOrder.status === "completed" ? "Confirmed" : "Confirm"}
              </Button>
              <span
                style={{
                  width: 20,
                  height: 2,
                  backgroundColor: ["delivered", "received"].includes(selectedOrder.status) ? "#52c41a" : "#d9d9d9",
                  marginRight: 8,
                }}
              />
              <Button
                type="primary"
                icon={<TruckFilled />}
                disabled={selectedOrder.status !== "completed" && !["delivered", "received"].includes(selectedOrder.status)}
                danger={!["delivered", "received"].includes(selectedOrder.status) && selectedOrder.status === "completed"}
                style={{
                  backgroundColor: ["delivered", "received"].includes(selectedOrder.status) ? "#52c41a" : (selectedOrder.status === "completed" ? "#ff4d4f" : undefined),
                  borderColor: ["delivered", "received"].includes(selectedOrder.status) ? "#52c41a" : (selectedOrder.status === "completed" ? "#ff4d4f" : undefined),
                  marginRight: 8,
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  color: "#fff",
                }}
                onClick={() => handleDelivery(selectedOrder)}
              >
                Delivery
              </Button>
              <span
                style={{
                  width: 20,
                  height: 2,
                  backgroundColor: selectedOrder.status === "received" ? "#52c41a" : "#d9d9d9",
                  marginRight: 8,
                }}
              />
              <Button
                type="primary"
                icon={<CheckSquareFilled />}
                disabled={selectedOrder.status !== "delivered" && selectedOrder.status !== "received"}
                danger={selectedOrder.status === "delivered" && selectedOrder.status !== "received"}
                style={{
                  backgroundColor: selectedOrder.status === "received" ? "#52c41a" : (selectedOrder.status === "delivered" ? "#ff4d4f" : undefined),
                  borderColor: selectedOrder.status === "received" ? "#52c41a" : (selectedOrder.status === "delivered" ? "#ff4d4f" : undefined),
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  color: "#fff",
                }}
                onClick={() => handleReceived(selectedOrder)}
              >
                Received
              </Button>
            </div>
            <Space style={{ marginBottom: 8, fontSize: 14 }}>
              <span>Items: {selectedOrder.totalItems || 0}</span>
              <span>|</span>
              <span>Amount: ₹{(selectedOrder.totalWithGST || 0).toFixed(2)}</span>
              <span>|</span>
              <span>
                Payment: {selectedOrder.paymentMethod
                  ? selectedOrder.paymentMethod.charAt(0).toUpperCase() + selectedOrder.paymentMethod.slice(1)
                  : "N/A"}
              </span>
            </Space>
            <div style={{ marginBottom: 8, fontSize: 14 }}>
              Order Date: {selectedOrder.createdAt ? dayjs(selectedOrder.createdAt).tz("Asia/Kolkata").format("DD/MM/YYYY, hh:mm A") : "N/A"},
              Delivery Date: {selectedOrder.deliveryDateTime ? dayjs(selectedOrder.deliveryDateTime).tz("Asia/Kolkata").format("DD/MM/YYYY, hh:mm A") : "N/A"},
              Last Updated: {selectedOrder.updatedAt ? dayjs(selectedOrder.updatedAt).tz("Asia/Kolkata").format("DD/MM/YYYY, hh:mm A") : "N/A"}
            </div>
            <Space style={{ marginBottom: 16, fontSize: 14 }}>
              <span>Waiter: {selectedOrder.waiterId?.name || "N/A"}</span>
              <span>|</span>
              <span>Manager: {selectedOrder.assignment?.managerId?.name || "N/A"}</span>
              <span>|</span>
              <span>Cashier: {selectedOrder.assignment?.cashierId?.name || "N/A"}</span>
            </Space>
            <Table
              columns={editModalColumns}
              dataSource={selectedOrder.products || []}
              pagination={false}
              rowKey={(record, index) => index}
              footer={() => modalFooter(selectedOrder.products)}
              bordered
              size="small"
              summary={editSummary}
            />
          </div>
        )}
      </Space>
      <Modal
        title={
          selectedOrder ? (
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ marginRight: 16 }}>
                Order {selectedOrder.billNo || "N/A"} - {selectedOrder.branchId?.name?.slice(0, 3).toUpperCase() || "UNK"} (
                {selectedOrder.status || "Unknown"})
              </span>
              <Button
                type="primary"
                icon={<CheckCircleFilled />}
                disabled={true}
                danger={!["completed", "delivered", "received"].includes(selectedOrder.status)}
                style={{
                  backgroundColor: ["completed", "delivered", "received"].includes(selectedOrder.status) ? "#52c41a" : "#ff4d4f",
                  borderColor: ["completed", "delivered", "received"].includes(selectedOrder.status) ? "#52c41a" : "#ff4d4f",
                  marginRight: 8,
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  color: "#fff",
                }}
              >
                {selectedOrder.status === "completed" ? "Confirmed" : "Confirm"}
              </Button>
              <span
                style={{
                  width: 20,
                  height: 2,
                  backgroundColor: ["delivered", "received"].includes(selectedOrder.status) ? "#52c41a" : "#d9d9d9",
                  marginRight: 8,
                }}
              />
              <Button
                type="primary"
                icon={<TruckFilled />}
                disabled={true}
                danger={!["delivered", "received"].includes(selectedOrder.status) && selectedOrder.status === "completed"}
                style={{
                  backgroundColor: ["delivered", "received"].includes(selectedOrder.status) ? "#52c41a" : (selectedOrder.status === "completed" ? "#ff4d4f" : undefined),
                  borderColor: ["delivered", "received"].includes(selectedOrder.status) ? "#52c41a" : (selectedOrder.status === "completed" ? "#ff4d4f" : undefined),
                  marginRight: 8,
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  color: "#fff",
                }}
              >
                Delivery
              </Button>
              <span
                style={{
                  width: 20,
                  height: 2,
                  backgroundColor: selectedOrder.status === "received" ? "#52c41a" : "#d9d9d9",
                  marginRight: 8,
                }}
              />
              <Button
                type="primary"
                icon={<CheckSquareFilled />}
                disabled={true}
                danger={selectedOrder.status === "delivered" && selectedOrder.status !== "received"}
                style={{
                  backgroundColor: selectedOrder.status === "received" ? "#52c41a" : (selectedOrder.status === "delivered" ? "#ff4d4f" : undefined),
                  borderColor: selectedOrder.status === "received" ? "#52c41a" : (selectedOrder.status === "delivered" ? "#ff4d4f" : undefined),
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  color: "#fff",
                }}
              >
                Received
              </Button>
            </div>
          ) : null
        }
        visible={visibleModal}
        onCancel={() => setVisibleModal(false)}
        footer={[
          <Button key="close" onClick={() => setVisibleModal(false)}>
            Close
          </Button>,
        ]}
        width={1000}
      >
        {selectedOrder && (
          <div>
            <Space style={{ marginBottom: 8, fontSize: 14 }}>
              <span>Items: {selectedOrder.totalItems || 0}</span>
              <span>|</span>
              <span>Amount: ₹{(selectedOrder.totalWithGST || 0).toFixed(2)}</span>
              <span>|</span>
              <span>
                Payment: {selectedOrder.paymentMethod
                  ? selectedOrder.paymentMethod.charAt(0).toUpperCase() + selectedOrder.paymentMethod.slice(1)
                  : "N/A"}
              </span>
            </Space>
            <div style={{ marginBottom: 8, fontSize: 14 }}>
              Order Date: {selectedOrder.createdAt ? dayjs(selectedOrder.createdAt).tz("Asia/Kolkata").format("DD/MM/YYYY, hh:mm A") : "N/A"},
              Delivery Date: {selectedOrder.deliveryDateTime ? dayjs(selectedOrder.deliveryDateTime).tz("Asia/Kolkata").format("DD/MM/YYYY, hh:mm A") : "N/A"},
              Last Updated: {selectedOrder.updatedAt ? dayjs(selectedOrder.updatedAt).tz("Asia/Kolkata").format("DD/MM/YYYY, hh:mm A") : "N/A"}
            </div>
            <Space style={{ marginBottom: 16, fontSize: 14 }}>
              <span>Waiter: {selectedOrder.waiterId?.name || "N/A"}</span>
              <span>|</span>
              <span>Manager: {selectedOrder.assignment?.managerId?.name || "N/A"}</span>
              <span>|</span>
              <span>Cashier: {selectedOrder.assignment?.cashierId?.name || "N/A"}</span>
            </Space>
            <Table
              columns={viewModalColumns}
              dataSource={selectedOrder.products || []}
              pagination={false}
              rowKey={(record, index) => index}
              footer={() => modalFooter(selectedOrder.products)}
              bordered
              size="small"
              summary={viewModalSummary}
            />
          </div>
        )}
      </Modal>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
            <span>
              {kotFilterType === "Branch" ? "KOT Report" : "KOT Report by Department"} - {branchFilter === "All" ? "All Branches" : branches.find((b) => b._id === branchFilter)?.name?.split(" ").slice(0, 2).join(" ") || branchFilter} ({statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)})
            </span>
            <Button
              type="primary"
              icon={<PrinterFilled />}
              onClick={handlePrintCombined}
              style={{ width: 32, height: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 8 }}
            />
          </div>
        }
        visible={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        closeIcon={
          <div style={{ backgroundColor: "#ff4d4f", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CloseOutlined style={{ color: "#fff", fontSize: 16 }} />
          </div>
        }
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
          <Text>
            Department: {departmentFilter === "All" ? "All Departments" : departments.find((d) => d._id === departmentFilter)?.name || departmentFilter},
            Category: {categoryFilter === "All" ? "All Categories" : categories.find((c) => c._id === categoryFilter)?.name || categoryFilter},
            Product: {productFilter === "All" ? "All Products" : productFilter}
          </Text>
          <Text>
            Dates: {getDateRangeAndOrderIds().earliestCreated} - {getDateRangeAndOrderIds().latestDelivery}
          </Text>
          <Text>
            Waiter: {(() => {
              const waiters = [...new Set(filteredOrders.map((order) => order.waiterId?.name).filter(Boolean))];
              return waiters.length > 0 ? waiters.join(", ") : "N/A";
            })()} |
            Manager: {(() => {
              const managers = [...new Set(filteredOrders.map((order) => order.assignment?.managerId?.name).filter(Boolean))];
              return managers.length > 0 ? managers.join(", ") : "N/A";
            })()} |
            Cashier: {(() => {
              const cashiers = [...new Set(filteredOrders.map((order) => order.assignment?.cashierId?.name).filter(Boolean))];
              return cashiers.length > 0 ? cashiers.join(", ") : "N/A";
            })()}
          </Text>
        </Space>
        <div style={{ marginBottom: 16 }}>
          <Text>
            Order IDs:{" "}
            {getDateRangeAndOrderIds().orderIds.split(", ").map((id, index) => {
              const match = id.match(/^([A-Z]{3})(\d{2})(\d{2})(\d{4})$/);
              if (match) {
                const [_, prefix, date, month, year] = match;
                return (
                  <span key={index}>
                    {prefix}<span style={{ fontWeight: 600 }}>{date}</span>{month}{year}
                    {index < getDateRangeAndOrderIds().orderIds.split(", ").length - 1 ? ", " : ""}
                  </span>
                );
              }
              return <span key={index}>{id}{index < getDateRangeAndOrderIds().orderIds.split(", ").length - 1 ? ", " : ""}</span>;
            })}
          </Text>
        </div>
        {kotData && (
          <div>
            {kotData.type === "Branch" ? (
              kotData.categories.map((cat) => (
                <div key={cat.name} style={{ marginBottom: 20 }}>
                  <Text strong style={{ fontSize: 14, display: "block", marginBottom: 8 }}>
                    {cat.name}
                  </Text>
                  {kotData.isAllBranches ? (
                    Object.entries(cat.branches)
                      .sort(([_, brA], [__, brB]) => brA.name.localeCompare(brB.name))
                      .map(([bPrefix, br]) => (
                        <div key={bPrefix} style={{ marginBottom: 12 }}>
                          <Text strong style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                            {br.name}
                          </Text>
                          <Table
                            columns={kotProductColumns}
                            dataSource={Object.entries(br.products)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([name, p]) => ({ ...p, name }))}
                            pagination={false}
                            size="small"
                            bordered
                            summary={() => {
                              const totalQty = Object.values(br.products).reduce((s, p) => s + p.qty, 0);
                              const totalPrice = Object.values(br.products).reduce((s, p) => s + p.totalPrice, 0);
                              return (
                                <Table.Summary>
                                  <Table.Summary.Row>
                                    <Table.Summary.Cell>Branch Total</Table.Summary.Cell>
                                    <Table.Summary.Cell>{totalQty}</Table.Summary.Cell>
                                    <Table.Summary.Cell></Table.Summary.Cell>
                                    <Table.Summary.Cell>₹{totalPrice.toFixed(2)}</Table.Summary.Cell>
                                  </Table.Summary.Row>
                                </Table.Summary>
                              );
                            }}
                          />
                        </div>
                      ))
                  ) : (
                    <Table
                      columns={kotProductColumns}
                      dataSource={Object.entries(cat.products)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([name, p]) => ({ ...p, name }))}
                      pagination={false}
                      size="small"
                      bordered
                      summary={() => {
                        const totalQty = Object.values(cat.products).reduce((s, p) => s + p.qty, 0);
                        const totalPrice = Object.values(cat.products).reduce((s, p) => s + p.totalPrice, 0);
                        return (
                          <Table.Summary>
                            <Table.Summary.Row>
                              <Table.Summary.Cell>Category Total</Table.Summary.Cell>
                              <Table.Summary.Cell>{totalQty}</Table.Summary.Cell>
                              <Table.Summary.Cell></Table.Summary.Cell>
                              <Table.Summary.Cell>₹{totalPrice.toFixed(2)}</Table.Summary.Cell>
                            </Table.Summary.Row>
                          </Table.Summary>
                        );
                      }}
                    />
                  )}
                  {kotData.isAllBranches && (
                    <Text strong style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                      Category Total (All Branches): Qty: {Object.values(cat.branches).reduce((sumBr, br) => sumBr + Object.values(br.products).reduce((sumP, p) => sumP + p.qty, 0), 0)}, Total: ₹{Object.values(cat.branches)
                        .reduce((sumBr, br) => sumBr + Object.values(br.products).reduce((sumP, p) => sumP + p.totalPrice, 0), 0)
                        .toFixed(2)}
                    </Text>
                  )}
                </div>
              ))
            ) : (
              kotData.departments.map((dept) => (
                <div key={dept.name} style={{ marginBottom: 20 }}>
                  <Text strong style={{ fontSize: 14, display: "block", marginBottom: 8 }}>
                    {dept.name}
                  </Text>
                  {Object.entries(dept.categories)
                    .sort(([_, catA], [__, catB]) => catA.name.localeCompare(catB.name))
                    .map(([catId, cat]) => (
                      <div key={catId} style={{ marginBottom: 12, marginLeft: 20 }}>
                        <Text strong style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                          {cat.name}
                        </Text>
                        <Table
                          columns={kotProductColumns}
                          dataSource={Object.entries(cat.products)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([name, p]) => ({ ...p, name }))}
                          pagination={false}
                          size="small"
                          bordered
                          summary={() => {
                            const totalQty = Object.values(cat.products).reduce((s, p) => s + p.qty, 0);
                            const totalPrice = Object.values(cat.products).reduce((s, p) => s + p.totalPrice, 0);
                            return (
                              <Table.Summary>
                                <Table.Summary.Row>
                                  <Table.Summary.Cell>Category Total</Table.Summary.Cell>
                                  <Table.Summary.Cell>{totalQty}</Table.Summary.Cell>
                                  <Table.Summary.Cell></Table.Summary.Cell>
                                  <Table.Summary.Cell>₹{totalPrice.toFixed(2)}</Table.Summary.Cell>
                                </Table.Summary.Row>
                              </Table.Summary>
                            );
                          }}
                        />
                      </div>
                    ))}
                  <Text strong style={{ fontSize: 12, display: "block", marginTop: 4, marginLeft: 20 }}>
                    Department Total: Qty: {Object.values(dept.categories).reduce((sumCat, cat) => sumCat + Object.values(cat.products).reduce((sumP, p) => sumP + p.qty, 0), 0)}, Total: ₹{Object.values(dept.categories)
                      .reduce((sumCat, cat) => sumCat + Object.values(cat.products).reduce((sumP, p) => sumP + p.totalPrice, 0), 0)
                      .toFixed(2)}
                  </Text>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
export async function getServerSideProps(context) {
  const { query } = context;
  const { branchId } = query;
  return {
    props: {
      branchId: branchId || null,
    },
  };
}
export default OrderListPage;