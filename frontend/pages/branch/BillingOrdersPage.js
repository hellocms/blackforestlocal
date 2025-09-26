import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { jwtDecode } from "jwt-decode";
import { Button, Table, Input, Select, DatePicker, Modal, Space, message, InputNumber, Typography, Switch } from "antd";
import { CloseSquareFilled, EyeFilled, PrinterFilled } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Summary } = Table;

const BillingOrdersPage = ({ branchId }) => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [productCatalog, setProductCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [filteredWaiters, setFilteredWaiters] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [productFilter, setProductFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All");
  const [waiterFilter, setWaiterFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("Today");
  const [customDateRange, setCustomDateRange] = useState([dayjs(), dayjs()]);
  const [loading, setLoading] = useState(false);
  const [visibleModal, setVisibleModal] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState("summary");

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

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
  }, [router]);

  const fetchOrders = async (token) => {
    setLoading(true);
    try {
      const url = branchId
        ? `${BACKEND_URL}/api/orders?branchId=${branchId}&tab=billing`
        : `${BACKEND_URL}/api/orders?tab=billing`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(data);
        setFilteredOrders(data);
        const uniqueProducts = [...new Set(data.flatMap(o => o.products.map(p => p.name)))].sort();
        setProducts(uniqueProducts);
        const uniqueWaiters = [...new Set(data
          .filter(o => o.waiterId && o.waiterId._id && o.waiterId.name)
          .map(o => JSON.stringify({ _id: o.waiterId._id, name: o.waiterId.name })))
        ].map(str => JSON.parse(str)).sort((a, b) => a.name.localeCompare(b.name));
        setWaiters(uniqueWaiters);
        setFilteredWaiters(uniqueWaiters);
      } else {
        message.error("Failed to fetch billing orders");
      }
    } catch (error) {
      message.error("Error fetching billing orders");
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

  const handleClearFilters = () => {
    setSearchQuery("");
    setBranchFilter("All");
    setProductFilter("All");
    setCategoryFilter("All");
    setPaymentMethodFilter("All");
    setWaiterFilter("All");
    setDateFilter("Today");
    setCustomDateRange([dayjs(), dayjs()]);
    message.success("Filters cleared");
  };

  const getDateRangeAndOrderIds = () => {
    let filteredOrders = orders;

    if (branchFilter !== "All") {
      filteredOrders = filteredOrders.filter((order) => order.branchId?._id === branchFilter);
    }

    if (paymentMethodFilter !== "All") {
      filteredOrders = filteredOrders.filter((order) => 
        order.paymentMethod?.toLowerCase() === paymentMethodFilter.toLowerCase()
      );
    }

    if (waiterFilter !== "All") {
      filteredOrders = filteredOrders.filter((order) => order.waiterId?._id === waiterFilter);
    }

    let dateRange = [null, null];
    if (dateFilter === "Today") {
      dateRange = [dayjs().startOf("day"), dayjs().endOf("day")];
    } else if (dateFilter === "Yesterday") {
      dateRange = [dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")];
    } else if (dateFilter === "Last 7 Days") {
      dateRange = [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")];
    } else if (dateFilter === "Last 30 Days") {
      dateRange = [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")];
    } else if (dateFilter === "Custom Date" && customDateRange[0]) {
      dateRange = [
        customDateRange[0].startOf("minute"),
        customDateRange[1] ? customDateRange[1].endOf("minute") : customDateRange[0].endOf("minute")
      ];
    }

    if (dateRange[0]) {
      const startDate = dateRange[0];
      const endDate = dateRange[1];

      filteredOrders = filteredOrders.filter((order) => {
        const createdDate = order.createdAt ? dayjs(order.createdAt) : null;
        return (
          createdDate &&
          !createdDate.isBefore(startDate) &&
          (!endDate || !createdDate.isAfter(endDate))
        );
      });
    }

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
      earliestCreated: earliestCreated ? earliestCreated.format("DD/MM/YYYY HH:mm:ss") : "N/A",
      latestDelivery: latestDelivery ? latestDelivery.format("DD/MM/YYYY HH:mm:ss") : "N/A",
      orderIds,
    };
  };

  const getFilteredTotals = (order) => {
    let filteredProducts = order.products;

    if (productFilter !== "All") {
      filteredProducts = filteredProducts.filter(p => p.name === productFilter);
    } else if (categoryFilter !== "All") {
      filteredProducts = filteredProducts.filter(p => {
        const product = productCatalog.find(prod => prod.name === p.name);
        return product && product.category?._id === categoryFilter;
      });
    }

    const totalItems = filteredProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalAmount = filteredProducts.reduce((sum, p) => sum + (p.productTotal || 0), 0);

    return { totalItems, totalAmount };
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

  const handleTotalAmountClick = async (record) => {
    const assignment = await fetchAssignment(record.branchId._id, record.createdAt);
    setSelectedOrder({ ...record, assignment });
    setIsEditMode(false);
    setVisibleModal(true);
  };

  const handleSaveSendingQty = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ products: selectedOrder.products }),
      });

      if (response.ok) {
        setOrders((prev) =>
          prev.map((o) => (o._id === selectedOrder._id ? { ...selectedOrder } : o))
        );
        setFilteredOrders((prev) =>
          prev.map((o) => (o._id === selectedOrder._id ? { ...selectedOrder } : o))
        );
        message.success("Sending quantities updated successfully");
        setVisibleModal(false);
      } else {
        message.error("Failed to update sending quantities");
      }
    } catch (error) {
      message.error("Error updating sending quantities");
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
        message.success(`Product ${currentConfirmed ? "unconfirmed" : "confirmed"} successfully`);
      } else {
        message.error("Failed to update product confirmation");
      }
    } catch (error) {
      message.error("Error updating product confirmation");
      console.error(error);
    }
  };

  const handlePreview = async () => {
    const combinedData = getCombinedProductData();
    if (combinedData.length === 0) {
      const branchName = branchFilter === "All" ? "all branches" : branches.find(b => b._id === branchFilter)?.name || branchFilter;
      const categoryName = categoryFilter === "All" ? "all categories" : categories.find(c => c._id === categoryFilter)?.name || categoryFilter;
      const productName = productFilter === "All" ? "all products" : productFilter;
      const paymentMethodName = paymentMethodFilter === "All" ? "all payment methods" : paymentMethodFilter;
      const waiterName = waiterFilter === "All" ? "all waiters" : waiters.find(w => w._id === waiterFilter)?.name || waiterFilter;
      message.info(`No billing orders found for ${categoryName}, ${productName}, ${paymentMethodName}, and ${waiterName} in ${branchName}.`);
      return;
    }

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
    const combinedData = getCombinedProductData();
    if (combinedData.length === 0) {
      const branchName = branchFilter === "All" ? "all branches" : branches.find(b => b._id === branchFilter)?.name || branchFilter;
      const categoryName = categoryFilter === "All" ? "all categories" : categories.find(c => c._id === categoryFilter)?.name || categoryFilter;
      const productName = productFilter === "All" ? "all products" : productFilter;
      const paymentMethodName = paymentMethodFilter === "All" ? "all payment methods" : paymentMethodFilter;
      const waiterName = waiterFilter === "All" ? "all waiters" : waiters.find(w => w._id === waiterFilter)?.name || waiterFilter;
      message.info(`No billing orders found for ${categoryName}, ${productName}, ${paymentMethodName}, and ${waiterName} in ${branchName}.`);
      return;
    }

    const { earliestCreated, latestDelivery, orderIds } = getDateRangeAndOrderIds();
    const printWindow = window.open("", "_blank");
    const currentDate = dayjs().tz("Asia/Kolkata").format("DD/MM/YYYY HH:mm:ss");
    const branchTitle = branchFilter === "All" ? "All Branches" : branches.find(b => b._id === branchFilter)?.name || branchFilter;
    const categoryTitle = categoryFilter === "All" ? "All Categories" : categories.find(c => c._id === categoryFilter)?.name || categoryFilter;
    const productTitle = productFilter === "All" ? "All Products" : productFilter;
    const paymentMethodTitle = paymentMethodFilter === "All" ? "All Payment Methods" : paymentMethodFilter;
    const waiterTitle = waiterFilter === "All" ? "All Waiters" : waiters.find(w => w._id === waiterFilter)?.name || waiterFilter;

    printWindow.document.write(`
      <html>
        <head>
          <title>Combined Billing Orders</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 302px; margin: 0; padding: 5px; font-size: 10px; line-height: 1.2; }
            h2 { text-align: center; font-size: 14px; font-weight: bold; margin: 0 0 5px 0; }
            p { margin: 2px 0; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th, td { padding: 2px; text-align: left; font-size: 10px; }
            th { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            @media print { @page { margin: 0; size: 80mm auto; } body { margin: 0; padding: 5px; } }
          </style>
        </head>
        <body>
          <h2>Combined Billing Orders - ${branchTitle}</h2>
          <p>Order IDs: ${orderIds}</p>
          <p>Category: ${categoryTitle}</p>
          <p>Product: ${productTitle}</p>
          <p>Payment Method: ${paymentMethodTitle}</p>
          <p>Waiter: ${waiterTitle}</p>
          <p>Created Date: ${earliestCreated}</p>
          <p>Delivery Date: ${latestDelivery}</p>
          <p>Date: ${currentDate}</p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Total Count</th>
                <th>Branch Breakdown</th>
              </tr>
            </thead>
            <tbody>
              ${combinedData
                .map(
                  (item) => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.totalCount}</td>
                  <td>${item.branchBreakdown}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="divider"></div>
          <p>Generated by [App Name] on ${currentDate}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const getCombinedProductData = () => {
    let statusOrders = orders;

    if (branchFilter !== "All") {
      statusOrders = statusOrders.filter((order) => order.branchId?._id === branchFilter);
    }

    if (paymentMethodFilter !== "All") {
      statusOrders = statusOrders.filter((order) => 
        order.paymentMethod?.toLowerCase() === paymentMethodFilter.toLowerCase()
      );
    }

    if (waiterFilter !== "All") {
      statusOrders = statusOrders.filter((order) => order.waiterId?._id === waiterFilter);
    }

    let dateRange = [null, null];
    if (dateFilter === "Today") {
      dateRange = [dayjs().startOf("day"), dayjs().endOf("day")];
    } else if (dateFilter === "Yesterday") {
      dateRange = [dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")];
    } else if (dateFilter === "Last 7 Days") {
      dateRange = [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")];
    } else if (dateFilter === "Last 30 Days") {
      dateRange = [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")];
    } else if (dateFilter === "Custom Date" && customDateRange[0]) {
      dateRange = [
        customDateRange[0].startOf("minute"),
        customDateRange[1] ? customDateRange[1].endOf("minute") : customDateRange[0].endOf("minute")
      ];
    }

    if (dateRange[0]) {
      const startDate = dateRange[0];
      const endDate = dateRange[1];

      statusOrders = statusOrders.filter((order) => {
        const createdDate = order.createdAt ? dayjs(order.createdAt) : null;
        return (
          createdDate &&
          !createdDate.isBefore(startDate) &&
          (!endDate || !createdDate.isAfter(endDate))
        );
      });
    }

    const productMap = {};

    statusOrders.forEach((order) => {
      const branchPrefix = order.branchId?.name?.slice(0, 3).toUpperCase() || "UNK";
      order.products
        .filter((product) => {
          const catalogProduct = productCatalog.find(p => p.name === product.name);
          return !categoryFilter || categoryFilter === "All" || (catalogProduct && catalogProduct.category?._id === categoryFilter);
        })
        .filter((product) => productFilter === "All" || product.name === productFilter)
        .forEach((product) => {
          if (!productMap[product.name]) {
            productMap[product.name] = { totalCount: 0, branches: {} };
          }
          productMap[product.name].totalCount += product.quantity || 0;
          productMap[product.name].branches[branchPrefix] =
            (productMap[product.name].branches[branchPrefix] || 0) + (product.quantity || 0);
        });
    });

    return Object.entries(productMap)
      .map(([productName, data]) => ({
        productName,
        totalCount: data.totalCount,
        branchBreakdown: Object.entries(data.branches)
          .map(([branch, count]) => `${branch}(${count})`)
          .join(" "),
      }))
      .sort((a, b) => a.productName.localeCompare(b.productName));
  };

  const getSummaryData = () => {
    const branchMap = {};

    filteredOrders.forEach((order) => {
      const branchId = order.branchId?._id || "unknown";
      const branchName = order.branchId?.name || "Unknown";
      const { totalAmount } = getFilteredTotals(order);

      if (!branchMap[branchId]) {
        branchMap[branchId] = {
          branchName,
          upiAmount: 0,
          creditCardAmount: 0,
          cashAmount: 0,
          totalBills: 0,
        };
      }

      if (order.paymentMethod?.toLowerCase() === "upi") {
        branchMap[branchId].upiAmount += totalAmount;
      } else if (order.paymentMethod?.toLowerCase() === "creditcard") {
        branchMap[branchId].creditCardAmount += totalAmount;
      } else if (order.paymentMethod?.toLowerCase() === "cash") {
        branchMap[branchId].cashAmount += totalAmount;
      }

      branchMap[branchId].totalBills += 1;
    });

    return Object.entries(branchMap)
      .map(([branchId, data], index) => ({
        key: branchId,
        sno: index + 1,
        branch: data.branchName,
        upiAmount: data.upiAmount,
        creditCardAmount: data.creditCardAmount,
        cashAmount: data.cashAmount,
        totalAmount: data.upiAmount + data.creditCardAmount + data.cashAmount,
        totalBills: data.totalBills,
      }))
      .sort((a, b) => a.branch.localeCompare(b.branch));
  };

  // Filter waiters based on selected branch and date range
  const getFilteredWaiters = () => {
    let filteredOrders = orders;

    let dateRange = [null, null];
    if (dateFilter === "Today") {
      dateRange = [dayjs().startOf("day"), dayjs().endOf("day")];
    } else if (dateFilter === "Yesterday") {
      dateRange = [dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")];
    } else if (dateFilter === "Last 7 Days") {
      dateRange = [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")];
    } else if (dateFilter === "Last 30 Days") {
      dateRange = [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")];
    } else if (dateFilter === "Custom Date" && customDateRange[0]) {
      dateRange = [
        customDateRange[0].startOf("minute"),
        customDateRange[1] ? customDateRange[1].endOf("minute") : customDateRange[0].endOf("minute")
      ];
    }

    if (dateRange[0]) {
      const startDate = dateRange[0];
      const endDate = dateRange[1];
      filteredOrders = filteredOrders.filter((order) => {
        const createdDate = order.createdAt ? dayjs(order.createdAt) : null;
        return (
          createdDate &&
          !createdDate.isBefore(startDate) &&
          (!endDate || !createdDate.isAfter(endDate))
        );
      });
    }

    if (branchFilter === "All") {
      const uniqueWaiters = [...new Set(filteredOrders
        .filter(o => o.waiterId && o.waiterId._id && o.waiterId.name)
        .map(o => JSON.stringify({ _id: o.waiterId._id, name: o.waiterId.name })))
      ].map(str => JSON.parse(str)).sort((a, b) => a.name.localeCompare(b.name));
      return uniqueWaiters;
    }

    const uniqueWaiters = [...new Set(filteredOrders
      .filter(o => o.branchId?._id === branchFilter && o.waiterId && o.waiterId._id && o.waiterId.name)
      .map(o => JSON.stringify({ _id: o.waiterId._id, name: o.waiterId.name })))
    ].map(str => JSON.parse(str)).sort((a, b) => a.name.localeCompare(b.name));
    return uniqueWaiters;
  };

  // Filter products based on selected category
  const getFilteredProducts = () => {
    if (categoryFilter === "All") {
      return products;
    }
    return productCatalog
      .filter((product) => product.category?._id === categoryFilter)
      .map((product) => product.name)
      .sort();
  };

  useEffect(() => {
    let filtered = [...orders];

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

    if (paymentMethodFilter !== "All") {
      filtered = filtered.filter((order) =>
        order.paymentMethod?.toLowerCase() === paymentMethodFilter.toLowerCase()
      );
    }

    if (waiterFilter !== "All") {
      filtered = filtered.filter((order) =>
        order.waiterId && order.waiterId._id === waiterFilter
      );
    }

    let dateRange = [null, null];
    if (dateFilter === "Today") {
      dateRange = [dayjs().startOf("day"), dayjs().endOf("day")];
    } else if (dateFilter === "Yesterday") {
      dateRange = [dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")];
    } else if (dateFilter === "Last 7 Days") {
      dateRange = [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")];
    } else if (dateFilter === "Last 30 Days") {
      dateRange = [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")];
    } else if (dateFilter === "Custom Date" && customDateRange[0]) {
      dateRange = [
        customDateRange[0].startOf("minute"),
        customDateRange[1] ? customDateRange[1].endOf("minute") : customDateRange[0].endOf("minute")
      ];
    }

    if (dateRange[0]) {
      const startDate = dateRange[0];
      const endDate = dateRange[1];

      filtered = filtered.filter((order) => {
        const createdDate = order.createdAt ? dayjs(order.createdAt) : null;
        return (
          createdDate &&
          !createdDate.isBefore(startDate) &&
          (!endDate || !createdDate.isAfter(endDate))
        );
      });
    }

    filtered = filtered.map(order => ({
      ...order,
      filteredTotals: getFilteredTotals(order)
    }));

    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setFilteredOrders(filtered);

    // Update filtered waiters when branch or date range changes
    setFilteredWaiters(getFilteredWaiters());
  }, [searchQuery, branchFilter, productFilter, categoryFilter, paymentMethodFilter, waiterFilter, dateFilter, customDateRange, orders, productCatalog]);

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
        <Space>
          <InputNumber
            min={0}
            value={text}
            onChange={(value) => handleSendingQtyChange(index, value)}
          />
          {text !== undefined && record.quantity !== undefined && text !== record.quantity && (
            text > record.quantity ? (
              <span style={{ color: 'green' }}>
                ↑ {text - record.quantity}
              </span>
            ) : (
              <span style={{ color: 'red' }}>
                ↓ {record.quantity - text}
              </span>
            )
          )}
        </Space>
      ),
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
      title: "Confirm",
      render: (record, _, index) => {
        const isOrderConfirmed = ["completed", "delivered", "received"].includes(selectedOrder.status);
        return (
          <Button
            type="primary"
            icon={<span>✅</span>}
            danger={!record.confirmed}
            disabled={isOrderConfirmed}
            style={{
              backgroundColor: record.confirmed ? "#52c41a" : "#ff4d4f",
              borderColor: record.confirmed ? "#52c41a" : "#ff4d4f",
              color: "#fff",
            }}
            onClick={() => handleToggleProductConfirm(index)}
          />
        );
      },
    },
  ];

  const viewModalColumns = [
    { title: "Product", dataIndex: "name", render: (value) => value || "Unknown" },
    { title: "Required Qty", dataIndex: "quantity", render: (value) => value || 0 },
    { title: "Unit", dataIndex: "unit", render: (value) => value || "N/A" },
    { title: "Price", dataIndex: "price", render: (value) => `₹${(value || 0).toFixed(2)}` },
    { title: "Total", render: (record) => `₹${((record.sendingQty || 0) * (record.price || 0)).toFixed(2)}` },
  ];

  const summaryColumns = [
    { title: "SNo", dataIndex: "sno", width: 80 },
    { title: "Branch", dataIndex: "branch", width: 200 },
    {
      title: "UPI Amount",
      dataIndex: "upiAmount",
      render: (value) => `₹${(value || 0).toFixed(2)}`,
      sorter: (a, b) => (a.upiAmount || 0) - (b.upiAmount || 0),
      width: 120,
    },
    {
      title: "Credit Card Amount",
      dataIndex: "creditCardAmount",
      render: (value) => `₹${(value || 0).toFixed(2)}`,
      sorter: (a, b) => (a.creditCardAmount || 0) - (b.creditCardAmount || 0),
      width: 120,
    },
    {
      title: "Cash Amount",
      dataIndex: "cashAmount",
      render: (value) => `₹${(value || 0).toFixed(2)}`,
      sorter: (a, b) => (a.cashAmount || 0) - (b.cashAmount || 0),
      width: 120,
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      render: (value) => `₹${(value || 0).toFixed(2)}`,
      sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
      width: 120,
    },
    {
      title: "Total Bills",
      dataIndex: "totalBills",
      sorter: (a, b) => (a.totalBills || 0) - (b.totalBills || 0),
      width: 120,
    },
  ];

  const detailedColumns = [
    { title: "SKU", render: (_, __, index) => index + 1, width: 80 },
    {
      title: "Bill No",
      dataIndex: "billNo",
      sorter: (a, b) => (a.billNo || "").localeCompare(b.billNo || ""),
      width: 150,
    },
    {
      title: "Branch Name",
      dataIndex: "branchId",
      render: (branchId) => branchId?.name || "Unknown",
      width: 120,
    },
    {
      title: "Total Items",
      render: (record) => getFilteredTotals(record).totalItems,
      width: 100,
    },
    {
      title: "Total Amount",
      render: (record) => (
        <a onClick={() => handleTotalAmountClick(record)}>
          ₹{(getFilteredTotals(record).totalAmount || 0).toFixed(2)}
        </a>
      ),
      sorter: (a, b) => (getFilteredTotals(a).totalAmount || 0) - (getFilteredTotals(b).totalAmount || 0),
      width: 120,
    },
    {
      title: "Waiter",
      dataIndex: "waiterId",
      render: (waiterId) => waiterId?.name || "N/A",
      sorter: (a, b) => (a.waiterId?.name || "").localeCompare(b.waiterId?.name || ""),
      width: 150,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      render: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : "N/A",
      width: 120,
    },
    {
      title: "Date",
      render: (record) => {
        const createdDate = record.createdAt 
          ? dayjs(record.createdAt).tz("Asia/Kolkata").format("DD/MM/YYYY HH:mm:ss") 
          : "N/A";
        return createdDate;
      },
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      width: 150,
    },
  ];

  const previewColumns = [
    { title: "Product Name", dataIndex: "productName", width: "30%" },
    { title: "Product Total Count", dataIndex: "totalCount", width: "20%" },
    { title: "Branch-wise Breakdown", dataIndex: "branchBreakdown", width: "50%" },
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
        <td>Total</td>
        <td>{totals.quantity}</td>
        <td>{totals.bminstock}</td>
        <td>{totals.sendingQty}</td>
        <td>{totals.unit || "N/A"}</td>
        <td>₹{(totals.price || 0).toFixed(2)}</td>
        <td>₹{(totals.total || 0).toFixed(2)}</td>
        <td></td>
      </tr>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <Space direction="vertical" style={{ width: "100%", marginBottom: "20px" }}>
        <Space wrap style={{ marginBottom: "10px" }}>
          <Space direction="vertical">
            <Text strong>Bill No:</Text>
            <Input
              placeholder="Enter Bill No"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 200 }}
            />
          </Space>
          <Space direction="vertical">
            <Text strong>Waiter:</Text>
            <Select
              value={waiterFilter}
              onChange={setWaiterFilter}
              style={{ width: 200 }}
              placeholder="Select Waiter"
            >
              <Option value="All">All Waiters</Option>
              {filteredWaiters.map((waiter) => (
                <Option key={waiter._id} value={waiter._id}>
                  {waiter.name}
                </Option>
              ))}
            </Select>
          </Space>
          <Space direction="vertical">
            <Text strong>For Billing:</Text>
            <Space>
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

        <Space wrap style={{ marginBottom: "10px" }}>
          <Space direction="vertical">
            <Text strong>Branch:</Text>
            <Select
              value={branchFilter}
              onChange={(value) => {
                setBranchFilter(value);
                setWaiterFilter("All"); // Reset waiter filter when branch changes
              }}
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
            <Text strong>Category:</Text>
            <Select
              value={categoryFilter}
              onChange={(value) => {
                setCategoryFilter(value);
                setProductFilter("All"); // Reset product filter when category changes
              }}
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
              {getFilteredProducts().map((product) => (
                <Option key={product} value={product}>
                  {product}
                </Option>
              ))}
            </Select>
          </Space>
          <Space direction="vertical">
            <Text strong>Date Range:</Text>
            <Space>
              <Select
                value={dateFilter}
                onChange={(value) => {
                  setDateFilter(value);
                  setWaiterFilter("All"); // Reset waiter filter when date range changes
                  if (value === "Today") {
                    setCustomDateRange([dayjs().startOf("day"), dayjs().endOf("day")]);
                  } else if (value === "Yesterday") {
                    setCustomDateRange([dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")]);
                  } else if (value === "Last 7 Days") {
                    setCustomDateRange([dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")]);
                  } else if (value === "Last 30 Days") {
                    setCustomDateRange([dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")]);
                  }
                }}
                style={{ width: 120 }}
              >
                <Option value="Today">Today</Option>
                <Option value="Yesterday">Yesterday</Option>
                <Option value="Last 7 Days">Last 7 Days</Option>
                <Option value="Last 30 Days">Last 30 Days</Option>
                <Option value="Custom Date">Custom Date</Option>
              </Select>
              <RangePicker
                showTime={{ format: "HH:mm" }}
                format="DD/MM/YYYY HH:mm"
                value={customDateRange}
                onChange={(dates) => {
                  setCustomDateRange(dates || [dayjs(), dayjs()]);
                  setDateFilter("Custom Date");
                  setWaiterFilter("All"); // Reset waiter filter when custom date changes
                }}
                style={{ width: 350 }}
              />
            </Space>
          </Space>
          <Space direction="vertical">
            <Text strong>Payment Method:</Text>
            <Select
              value={paymentMethodFilter}
              onChange={setPaymentMethodFilter}
              style={{ width: 120 }}
              placeholder="Select Payment Method"
            >
              <Option value="All">All Payment Methods</Option>
              <Option value="UPI">UPI</Option>
              <Option value="CreditCard">Credit Card</Option>
              <Option value="Cash">Cash</Option>
            </Select>
          </Space>
          <Space direction="vertical">
            <Text strong>View Mode:</Text>
            <Switch
              checked={viewMode === "detailed"}
              onChange={(checked) => setViewMode(checked ? "detailed" : "summary")}
              checkedChildren="Detailed"
              unCheckedChildren="Summary"
              style={{ width: 100 }}
            />
          </Space>
        </Space>

        {viewMode === "summary" ? (
          <Table
            columns={summaryColumns}
            dataSource={getSummaryData()}
            loading={loading}
            pagination={{ pageSize: 10 }}
            rowKey="key"
            scroll={{ x: 850 }}
            summary={() => {
              const summaryData = getSummaryData();
              const totalUpiAmount = summaryData.reduce((sum, item) => sum + (item.upiAmount || 0), 0);
              const totalCreditCardAmount = summaryData.reduce((sum, item) => sum + (item.creditCardAmount || 0), 0);
              const totalCashAmount = summaryData.reduce((sum, item) => sum + (item.cashAmount || 0), 0);
              const totalAmount = summaryData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
              const totalBills = summaryData.reduce((sum, item) => sum + (item.totalBills || 0), 0);
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} style={{ fontWeight: "bold" }}></Table.Summary.Cell>
                    <Table.Summary.Cell index={1} style={{ fontWeight: "bold" }}>Overall Total</Table.Summary.Cell>
                    <Table.Summary.Cell index={2} style={{ fontWeight: "bold" }}>
                      ₹{totalUpiAmount.toFixed(2)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} style={{ fontWeight: "bold" }}>
                      ₹{totalCreditCardAmount.toFixed(2)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} style={{ fontWeight: "bold" }}>
                      ₹{totalCashAmount.toFixed(2)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} style={{ fontWeight: "bold" }}>
                      ₹{totalAmount.toFixed(2)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} style={{ fontWeight: "bold" }}>
                      {totalBills}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        ) : (
          <Table
            columns={detailedColumns}
            dataSource={filteredOrders}
            loading={loading}
            pagination={{ pageSize: 10 }}
            rowKey="_id"
            scroll={{ x: 750 }}
            summary={() => {
              const totalItems = filteredOrders.reduce((sum, order) => sum + (getFilteredTotals(order).totalItems || 0), 0);
              const totalAmount = filteredOrders.reduce((sum, order) => sum + (getFilteredTotals(order).totalAmount || 0), 0);
              const totalBills = filteredOrders.length;
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} style={{ fontWeight: "bold" }}></Table.Summary.Cell>
                    <Table.Summary.Cell index={1} style={{ fontWeight: "bold" }}>{totalBills}</Table.Summary.Cell>
                    <Table.Summary.Cell index={2} style={{ fontWeight: "bold" }}></Table.Summary.Cell>
                    <Table.Summary.Cell index={3} style={{ fontWeight: "bold" }}>{totalItems}</Table.Summary.Cell>
                    <Table.Summary.Cell index={4} style={{ fontWeight: "bold" }}>
                      ₹{totalAmount.toFixed(2)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} style={{ fontWeight: "bold" }}></Table.Summary.Cell>
                    <Table.Summary.Cell index={6} style={{ fontWeight: "bold" }}></Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        )}
      </Space>
      <Modal
        title={selectedOrder ? `Order ${selectedOrder.billNo || "N/A"} - ${selectedOrder.branchId?.name || "Unknown"}` : null}
        open={visibleModal}
        onCancel={() => setVisibleModal(false)}
        footer={
          isEditMode
            ? [
                <Button key="cancel" onClick={() => setVisibleModal(false)}>
                  Cancel
                </Button>,
                <Button key="save" type="primary" onClick={handleSaveSendingQty}>
                  Save
                </Button>,
              ]
            : [
                <Button key="close" onClick={() => setVisibleModal(false)}>
                  Close
                </Button>,
              ]
        }
        width={800}
      >
        {selectedOrder && (
          <div>
            <Space style={{ marginBottom: 8, fontSize: 14 }}>
              <span>Items: {selectedOrder.filteredTotals?.totalItems || selectedOrder.totalItems || 0}</span>
              <span>|</span>
              <span>Amount: ₹{(selectedOrder.filteredTotals?.totalAmount || selectedOrder.totalWithGST || 0).toFixed(2)}</span>
              <span>|</span>
              <span>
                Payment: {selectedOrder.paymentMethod
                  ? selectedOrder.paymentMethod.charAt(0).toUpperCase() + selectedOrder.paymentMethod.slice(1)
                  : "N/A"}
              </span>
            </Space>
            <div style={{ marginBottom: 8, fontSize: 14 }}>
              Dates: {selectedOrder.createdAt ? dayjs(selectedOrder.createdAt).tz("Asia/Kolkata").format("DD/MM/YYYY HH:mm:ss") : "N/A"}
              {selectedOrder.deliveryDateTime && ` - ${dayjs(selectedOrder.deliveryDateTime).tz("Asia/Kolkata").format("DD/MM/YYYY HH:mm:ss")}`}
            </div>
            <Space style={{ marginBottom: 16, fontSize: 14 }}>
              <span>Waiter: {selectedOrder.waiterId?.name || "N/A"}</span>
              <span>|</span>
              <span>Manager: {selectedOrder.assignment?.managerId?.name || "N/A"}</span>
              <span>|</span>
              <span>Cashier: {selectedOrder.assignment?.cashierId?.name || "N/A"}</span>
            </Space>
            <Table
              columns={isEditMode ? editModalColumns : viewModalColumns}
              dataSource={selectedOrder.products || []}
              pagination={false}
              rowKey={(record, index) => index}
              footer={() => modalFooter(selectedOrder.products)}
            />
          </div>
        )}
      </Modal>
      <Modal
        title={`Combined Billing Orders - ${branchFilter === "All" ? "All Branches" : branches.find(b => b._id === branchFilter)?.name || branchFilter}`}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
          <Text>
            Category: {categoryFilter === "All" ? "All Categories" : categories.find(c => c._id === categoryFilter)?.name || categoryFilter}, 
            Product: {productFilter === "All" ? "All Products" : productFilter}, 
            Payment Method: {paymentMethodFilter === "All" ? "All Payment Methods" : paymentMethodFilter}, 
            Waiter: {waiterFilter === "All" ? "All Waiters" : waiters.find(w => w._id === waiterFilter)?.name || waiterFilter}
          </Text>
          <Text>
            Dates: {getDateRangeAndOrderIds().earliestCreated} - {getDateRangeAndOrderIds().latestDelivery}
          </Text>
          <Text>
            Waiter: {(() => {
              const waiters = [...new Set(filteredOrders.map(order => order.waiterId?.name).filter(Boolean))];
              return waiters.length > 0 ? waiters.join(", ") : "N/A";
            })()} | 
            Manager: {(() => {
              const managers = [...new Set(filteredOrders.map(order => order.assignment?.managerId?.name).filter(Boolean))];
              return managers.length > 0 ? managers.join(", ") : "N/A";
            })()} | 
            Cashier: {(() => {
              const cashiers = [...new Set(filteredOrders.map(order => order.assignment?.cashierId?.name).filter(Boolean))];
              return cashiers.length > 0 ? cashiers.join(", ") : "N/A";
            })()}
          </Text>
        </Space>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text>
            Order IDs: {getDateRangeAndOrderIds().orderIds.split(", ").map((id, index) => {
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
          <Button
            type="primary"
            icon={<PrinterFilled />}
            onClick={handlePrintCombined}
            style={{ width: 32, height: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          />
        </div>
        <Table
          columns={previewColumns}
          dataSource={getCombinedProductData()}
          pagination={false}
          locale={{ emptyText: `No billing orders found for ${categoryFilter === "All" ? "all categories" : categories.find(c => c._id === categoryFilter)?.name || categoryFilter}, ${productFilter === "All" ? "all products" : productFilter}, ${paymentMethodFilter === "All" ? "all payment methods" : paymentMethodFilter}, and ${waiterFilter === "All" ? "all waiters" : waiters.find(w => w._id === waiterFilter)?.name || waiterFilter} across ${branchFilter === "All" ? "all branches" : branches.find(b => b._id === branchFilter)?.name || branchFilter}` }}
          rowKey="productName"
        />
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

export default BillingOrdersPage;