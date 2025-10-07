import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { jwtDecode } from "jwt-decode";
import { Button, Table, Select, DatePicker, Space, message, Typography, Modal } from "antd";
import { CloseSquareFilled, PrinterFilled } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

const BranchBillsManagementPage = ({ branchId: propBranchId }) => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("Today");
  const [customDateRange, setCustomDateRange] = useState([dayjs().startOf("day"), dayjs().endOf("day")]);
  const [loading, setLoading] = useState(false);
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [billModalVisible, setBillModalVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [sortByAmount, setSortByAmount] = useState(true);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

  const computeDateRange = () => {
    let start, end;
    if (dateFilter === "Today") {
      start = dayjs().startOf("day");
      end = dayjs().endOf("day");
    } else if (dateFilter === "Yesterday") {
      start = dayjs().subtract(1, "day").startOf("day");
      end = dayjs().subtract(1, "day").endOf("day");
    } else if (dateFilter === "Last 7 Days") {
      start = dayjs().subtract(6, "day").startOf("day");
      end = dayjs().endOf("day");
    } else if (dateFilter === "Last 30 Days") {
      start = dayjs().subtract(29, "day").startOf("day");
      end = dayjs().endOf("day");
    } else if (dateFilter === "Till Now") {
      start = dayjs().startOf("month");
      end = dayjs().endOf("day");
    } else if (dateFilter === "Custom Date" && customDateRange[0]) {
      start = customDateRange[0].startOf("minute");
      end = customDateRange[1] ? customDateRange[1].endOf("minute") : customDateRange[0].endOf("minute");
    }
    return [start ? start.toISOString() : null, end ? end.toISOString() : null];
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);

    if (!storedToken) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode(storedToken);
      const role = decoded.role;
      if (!["admin", "superadmin"].includes(role)) {
        router.push("/login");
        return;
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      router.push("/login");
      return;
    }

    if (propBranchId) {
      setBranchFilter(propBranchId);
    }
  }, [router, propBranchId]);

  useEffect(() => {
    if (!token) return;

    const fetchBranchesAsync = async () => {
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

    fetchBranchesAsync();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const dateRange = computeDateRange();
    const currentBranchId = branchFilter !== "All" ? branchFilter : undefined;
    fetchOrders(token, currentBranchId, dateRange[0], dateRange[1]);
  }, [token, branchFilter, dateFilter, customDateRange]);

  const fetchOrders = async (token, branchIdParam, startDate, endDate) => {
    setLoading(true);
    try {
      let params = new URLSearchParams({ tab: "billing" });
      if (branchIdParam) params.append("branchId", branchIdParam);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const url = `${BACKEND_URL}/api/orders?${params.toString()}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(data);
      } else {
        message.error("Failed to fetch billing orders");
      }
    } catch (error) {
      message.error("Error fetching orders");
      console.error(error);
    }
    setLoading(false);
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

  const handlePrint = () => {
    const data = getSummaryData();
    const title = "Branch Bills Summary";
    const branchTitle = branchFilter === "All" ? "All Branches" : branches.find((b) => b._id === branchFilter)?.name || branchFilter;
    const currentDate = dayjs().tz("Asia/Kolkata").format("DD/MM/YYYY HH:mm:ss");

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            h2 { text-align: center; font-size: 16px; }
            p { margin: 5px 0; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 5px; border: 1px solid #000; text-align: left; }
            th { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            @media print { @page { margin: 10mm; } }
          </style>
        </head>
        <body>
          <h2>${title} - ${branchTitle}</h2>
          <p>Date Range: ${dateFilter === "Custom Date" ? customDateRange[0].format("DD/MM/YYYY HH:mm") + " - " + (customDateRange[1] ? customDateRange[1].format("DD/MM/YYYY HH:mm") : customDateRange[0].format("DD/MM/YYYY HH:mm")) : dateFilter === "Till Now" ? `${dayjs().startOf("month").format("DD/MM/YYYY")} - ${dayjs().format("DD/MM/YYYY")}` : dateFilter}</p>
          <p>Generated on: ${currentDate}</p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th>SNo</th>
                <th>Branch Name</th>
                <th>Total Amount</th>
                <th>Total Bills</th>
                <th>Billing Days</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((item) => `
                <tr>
                  <td>${item.sno}</td>
                  <td>${item.branchName}</td>
                  <td>₹${(item.totalAmount || 0).toFixed(2)}</td>
                  <td>${item.totalBills}</td>
                  <td>${item.attendance}</td>
                </tr>
              `).join("")}
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

  const handleClearFilters = () => {
    setBranchFilter("All");
    setDateFilter("Today");
    setCustomDateRange([dayjs().startOf("day"), dayjs().endOf("day")]);
    message.success("Filters cleared");
  };

  const handleBranchClick = (record) => {
    setSelectedBranch({ id: record.key, name: record.branchName });
    setBranchModalVisible(true);
  };

  const handleTotalAmountClick = async (record) => {
    const assignment = await fetchAssignment(record.branchId, record.createdAt);
    setSelectedBill({ ...record, assignment });
    setBillModalVisible(true);
  };

  const getDateRangeText = () => {
    if (dateFilter === "Custom Date" && customDateRange[0]) {
      return `${customDateRange[0].format("DD/MM/YYYY HH:mm")} - ${customDateRange[1] ? customDateRange[1].format("DD/MM/YYYY HH:mm") : customDateRange[0].format("DD/MM/YYYY HH:mm")}`;
    }
    if (dateFilter === "Till Now") {
      return `${dayjs().startOf("month").format("DD/MM/YYYY")} - ${dayjs().format("DD/MM/YYYY")}`;
    }
    return dateFilter;
  };

  useEffect(() => {
    let filtered = [...orders];
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setFilteredOrders(filtered);
  }, [orders]);

  const getSummaryData = () => {
    const branchMap = {};
    filteredOrders.forEach((order) => {
      const branchId = order.branchId?._id || "unknown";
      const branchName = order.branchId?.name || "Unknown";
      const totalAmount = order.totalWithGST || 0;
      const createdDate = order.createdAt ? dayjs(order.createdAt).format("YYYY-MM-DD") : null;

      if (!branchMap[branchId]) {
        branchMap[branchId] = {
          branchName,
          totalAmount: 0,
          totalBills: 0,
          billingDays: new Set(),
        };
      }

      branchMap[branchId].totalAmount += totalAmount;
      branchMap[branchId].totalBills += 1;
      if (createdDate) {
        branchMap[branchId].billingDays.add(createdDate);
      }
    });

    let summaryData = Object.entries(branchMap).map(([branchId, data]) => ({
      key: branchId,
      branchName: data.branchName,
      totalAmount: data.totalAmount,
      totalBills: data.totalBills,
      attendance: data.billingDays.size,
    }));

    if (sortByAmount) {
      summaryData.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    } else {
      summaryData.sort((a, b) => a.branchName.localeCompare(b.branchName));
    }

    summaryData = summaryData.map((item, index) => ({ ...item, sno: index + 1 }));

    return summaryData;
  };

  const getWaiterSummaryForBranch = (branchId) => {
    if (!branchId) return [];
    const branchOrders = filteredOrders.filter((o) => o.branchId?._id === branchId);
    const waiterMap = {};

    branchOrders.forEach((order) => {
      const waiterId = order.waiterId?._id || "unknown";
      const waiterName = order.waiterId?.name || "Unknown";
      const totalAmount = order.totalWithGST || 0;
      const createdDate = order.createdAt ? dayjs(order.createdAt).format("YYYY-MM-DD") : null;

      if (!waiterMap[waiterId]) {
        waiterMap[waiterId] = {
          waiterName,
          totalAmount: 0,
          totalBills: 0,
          billingDays: new Set(),
        };
      }

      waiterMap[waiterId].totalAmount += totalAmount;
      waiterMap[waiterId].totalBills += 1;
      if (createdDate) {
        waiterMap[waiterId].billingDays.add(createdDate);
      }
    });

    let summaryData = Object.entries(waiterMap).map(([waiterId, data]) => ({
      key: waiterId,
      waiterName: data.waiterName,
      totalAmount: data.totalAmount,
      totalBills: data.totalBills,
      attendance: data.billingDays.size,
    }));

    summaryData.sort((a, b) => a.waiterName.localeCompare(b.waiterName));

    return summaryData;
  };

  const waiterModalColumns = [
    { title: "Waiter Name", dataIndex: "waiterName", width: 200 },
    {
      title: "Bill Count",
      dataIndex: "totalBills",
      sorter: (a, b) => (a.totalBills || 0) - (b.totalBills || 0),
      width: 120,
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      render: (value) => `₹${(value || 0).toFixed(2)}`,
      sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
      width: 150,
    },
    {
      title: "Attendance (Billing Days)",
      dataIndex: "attendance",
      sorter: (a, b) => (a.attendance || 0) - (b.attendance || 0),
      width: 150,
    },
  ];

  const billModalColumns = [
    { title: "Product", dataIndex: "name", render: (value) => value || "Unknown" },
    { title: "Quantity", dataIndex: "quantity", render: (value) => value || 0 },
    { title: "Unit", dataIndex: "unit", render: (value) => value || "N/A" },
    { title: "Price", dataIndex: "price", render: (value) => `₹${(value || 0).toFixed(2)}` },
    { title: "Total", render: (record) => `₹${((record.quantity || 0) * (record.price || 0)).toFixed(2)}` },
  ];

  const summaryColumns = [
    { title: "SNo", dataIndex: "sno", width: 80 },
    { title: "Branch Name", dataIndex: "branchName", width: 200 },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      render: (text, record) => <a onClick={() => handleBranchClick(record)}>₹{(text || 0).toFixed(2)}</a>,
      sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
      width: 150,
    },
    {
      title: "Total Bills",
      dataIndex: "totalBills",
      sorter: (a, b) => (a.totalBills || 0) - (b.totalBills || 0),
      width: 120,
    },
    {
      title: "Billing Days",
      dataIndex: "attendance",
      sorter: (a, b) => (a.attendance || 0) - (b.attendance || 0),
      width: 150,
    },
  ];

  const calculateBillTotals = (products) => {
    return {
      quantity: products.reduce((sum, p) => sum + (p.quantity || 0), 0),
      price: products.reduce((sum, p) => sum + (p.price || 0), 0),
      total: products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0),
    };
  };

  const billModalFooter = (products) => {
    const totals = calculateBillTotals(products || []);
    return (
      <Table.Summary.Row style={{ fontWeight: "bold" }}>
        <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
        <Table.Summary.Cell index={1}>{totals.quantity}</Table.Summary.Cell>
        <Table.Summary.Cell index={2}></Table.Summary.Cell>
        <Table.Summary.Cell index={3}>₹{(totals.price || 0).toFixed(2)}</Table.Summary.Cell>
        <Table.Summary.Cell index={4}>₹{(totals.total || 0).toFixed(2)}</Table.Summary.Cell>
      </Table.Summary.Row>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <Space direction="vertical" style={{ width: "100%", marginBottom: "20px" }}>
        <Space wrap style={{ marginBottom: "10px" }}>
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
            <Space>
              <Select
                value={dateFilter}
                onChange={(value) => {
                  setDateFilter(value);
                  if (value === "Today") {
                    setCustomDateRange([dayjs().startOf("day"), dayjs().endOf("day")]);
                  } else if (value === "Yesterday") {
                    setCustomDateRange([dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")]);
                  } else if (value === "Last 7 Days") {
                    setCustomDateRange([dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")]);
                  } else if (value === "Last 30 Days") {
                    setCustomDateRange([dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")]);
                  } else if (value === "Till Now") {
                    setCustomDateRange([dayjs().startOf("month"), dayjs().endOf("day")]);
                  }
                }}
                style={{ width: 120 }}
              >
                <Option value="Today">Today</Option>
                <Option value="Yesterday">Yesterday</Option>
                <Option value="Last 7 Days">Last 7 Days</Option>
                <Option value="Last 30 Days">Last 30 Days</Option>
                <Option value="Till Now">Till Now</Option>
                <Option value="Custom Date">Custom Date</Option>
              </Select>
              <RangePicker
                showTime={{ format: "HH:mm" }}
                format="DD/MM/YYYY HH:mm"
                value={customDateRange}
                onChange={(dates) => {
                  setCustomDateRange(dates || [dayjs().startOf("day"), dayjs().endOf("day")]);
                  setDateFilter("Custom Date");
                }}
                style={{ width: 350 }}
              />
            </Space>
          </Space>
          <Space direction="vertical">
            <Text strong>Actions:</Text>
            <Space>
              <Button
                type="primary"
                icon={<PrinterFilled />}
                onClick={handlePrint}
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
          columns={summaryColumns}
          dataSource={getSummaryData()}
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowKey="key"
          scroll={{ x: 600 }}
          summary={() => {
            const summaryData = getSummaryData();
            const totalAmount = summaryData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
            const totalBills = summaryData.reduce((sum, item) => sum + (item.totalBills || 0), 0);
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} style={{ fontWeight: "bold" }}></Table.Summary.Cell>
                  <Table.Summary.Cell index={1} style={{ fontWeight: "bold" }}>Overall Total</Table.Summary.Cell>
                  <Table.Summary.Cell index={2} style={{ fontWeight: "bold" }}>
                    ₹{totalAmount.toFixed(2)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} style={{ fontWeight: "bold" }}>
                    {totalBills}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} style={{ fontWeight: "bold" }}></Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Space>

      <Modal
        title={selectedBranch ? `Waiter-wise Details for ${selectedBranch.name} (${getDateRangeText()})` : "Waiter Details"}
        open={branchModalVisible}
        onCancel={() => setBranchModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setBranchModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedBranch && (
          <Table
            columns={waiterModalColumns}
            dataSource={getWaiterSummaryForBranch(selectedBranch.id)}
            pagination={false}
            rowKey="key"
            summary={() => {
              const data = getWaiterSummaryForBranch(selectedBranch.id);
              const totalBills = data.reduce((sum, item) => sum + (item.totalBills || 0), 0);
              const totalAmount = data.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} style={{ fontWeight: "bold" }}>Total</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} style={{ fontWeight: "bold" }}>{totalBills}</Table.Summary.Cell>
                    <Table.Summary.Cell index={2} style={{ fontWeight: "bold" }}>
                      ₹{totalAmount.toFixed(2)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} style={{ fontWeight: "bold" }}></Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        )}
      </Modal>

      <Modal
        title={selectedBill ? `Bill ${selectedBill.billNo} - ${selectedBill.branchName}` : "Bill Details"}
        open={billModalVisible}
        onCancel={() => setBillModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setBillModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedBill && (
          <div>
            <Space style={{ marginBottom: 8, fontSize: 14 }}>
              <span>Items: {selectedBill.totalItems}</span>
              <span>|</span>
              <span>Amount: ₹{(selectedBill.totalAmount || 0).toFixed(2)}</span>
              <span>|</span>
              <span>
                Payment: {selectedBill.paymentMethod
                  ? selectedBill.paymentMethod.charAt(0).toUpperCase() + selectedBill.paymentMethod.slice(1)
                  : "N/A"}
              </span>
            </Space>
            <div style={{ marginBottom: 8, fontSize: 14 }}>
              Date: {selectedBill.date}
            </div>
            <Space style={{ marginBottom: 16, fontSize: 14 }}>
              <span>Waiter: {selectedBill.waiterName}</span>
              <span>|</span>
              <span>Manager: {selectedBill.assignment?.managerId?.name || "N/A"}</span>
              <span>|</span>
              <span>Cashier: {selectedBill.assignment?.cashierId?.name || "N/A"}</span>
            </Space>
            <Table
              columns={billModalColumns}
              dataSource={selectedBill.products}
              pagination={false}
              rowKey={(record, index) => index}
              summary={() => billModalFooter(selectedBill.products)}
            />
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

export default BranchBillsManagementPage;