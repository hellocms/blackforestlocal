import React, { useState, useEffect, useMemo } from "react";
import { Card, Typography, Select, Button, Table, Space, DatePicker, message, Layout, Spin } from "antd";
import { PrinterOutlined, ClearOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isBetween from "dayjs/plugin/isBetween";
import { useRouter } from "next/router";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title as ChartTitle, Tooltip, Legend } from "chart.js";

dayjs.extend(utc);
dayjs.extend(isBetween);
ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const PaymentHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSourceFilter, setSelectedSourceFilter] = useState(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState(null);
  const [selectedPredefinedRange, setSelectedPredefinedRange] = useState(null);

  const router = useRouter();
  const BACKEND_URL = "http://localhost:5001";

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        message.info("Please log in to access the page");
        router.push("/login");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/financial/transactions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (response.ok && Array.isArray(result)) {
        const formattedTransactions = result.map((t) => ({
          id: t._id,
          date: t.date,
          type: t.type,
          source: t.source,
          branch: t.branch?.name || "N/A",
          branchId: t.branch?._id,
          amount: Number(t.amount) || 0,
          expenseCategory: t.expenseCategory,
          remarks: t.remarks,
          updatedByBranch: t.updatedByBranchId?.name || "N/A",
        }));
        console.log("Fetched transactions:", formattedTransactions);
        setTransactions(formattedTransactions);
        setFilteredTransactions(formattedTransactions);
      } else {
        console.error("Invalid transactions response:", result);
        message.error(result.message || "Failed to fetch transactions");
        setTransactions([]);
        setFilteredTransactions([]);
      }
    } catch (err) {
      console.error("Fetch transactions error:", err);
      message.error("Server error while fetching transactions");
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BACKEND_URL}/api/branches/public`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (response.ok && Array.isArray(result)) {
        console.log("Fetched branches:", result);
        setBranches(result);
      } else {
        console.error("Invalid branches response:", result);
        message.error("Failed to fetch branches");
        setBranches([]);
      }
    } catch (err) {
      console.error("Fetch branches error:", err);
      message.error("Server error while fetching branches");
      setBranches([]);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchBranches();
  }, [router]);

  const chartData = useMemo(() => {
    if (!Array.isArray(filteredTransactions) || filteredTransactions.length === 0) {
      console.log("No valid transactions for chart");
      return null;
    }

    try {
      let startDate, endDate, daysInRange;

      if (selectedDateRange && selectedDateRange.length === 2) {
        startDate = dayjs(selectedDateRange[0]).startOf("day");
        endDate = dayjs(selectedDateRange[1]).endOf("day");
        daysInRange = endDate.diff(startDate, "day") + 1;
      } else {
        startDate = dayjs().startOf("month");
        endDate = dayjs().endOf("month");
        daysInRange = startDate.daysInMonth();
      }

      const labels = Array.from({ length: daysInRange }, (_, i) =>
        startDate.add(i, "day").format("YYYY-MM-DD")
      );

      const creditData = new Array(daysInRange).fill(0);
      const debitData = new Array(daysInRange).fill(0);

      filteredTransactions.forEach((t) => {
        const transactionDate = dayjs(t.date);
        if (
          t.date &&
          transactionDate.isValid() &&
          transactionDate.isBetween(startDate, endDate, null, "[]")
        ) {
          const dayIndex = transactionDate.diff(startDate, "day");
          if (t.type === "Credit - Deposit" && typeof t.amount === "number") {
            creditData[dayIndex] += t.amount;
          } else if (t.type === "Debit - Expense" && typeof t.amount === "number") {
            debitData[dayIndex] += t.amount;
          }
        }
      });

      const data = {
        labels,
        datasets: [
          {
            label: "Credit - Deposit",
            data: creditData,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            stack: "Stack 0",
          },
          {
            label: "Debit - Expense",
            data: debitData,
            backgroundColor: "rgba(255, 99, 132, 0.6)",
            stack: "Stack 0",
          },
        ],
      };

      console.log("Prepared chart data:", data);
      return data;
    } catch (err) {
      console.error("Error preparing chart data:", err);
      return null;
    }
  }, [filteredTransactions, selectedDateRange]);

  useEffect(() => {
    let filtered = [...transactions];

    if (selectedSourceFilter) {
      filtered = filtered.filter((t) => t.source === selectedSourceFilter);
    }

    if (selectedTypeFilter) {
      filtered = filtered.filter((t) => t.type === selectedTypeFilter);
    }

    if (selectedDateRange && selectedDateRange.length === 2) {
      const startDate = dayjs(selectedDateRange[0]).startOf("day");
      const endDate = dayjs(selectedDateRange[1]).endOf("day");
      filtered = filtered.filter((t) => {
        const transactionDate = dayjs(t.date);
        return (
          t.date &&
          transactionDate.isValid() &&
          transactionDate.isBetween(startDate, endDate, null, "[]")
        );
      });
    }

    if (selectedBranchFilter) {
      filtered = filtered.filter((t) => t.branchId === selectedBranchFilter);
    }

    console.log("Filtered transactions:", filtered);
    setFilteredTransactions(filtered);
  }, [
    transactions,
    selectedSourceFilter,
    selectedTypeFilter,
    selectedDateRange,
    selectedBranchFilter,
  ]);

  const handleSourceFilter = (value) => {
    setSelectedSourceFilter(value);
  };

  const handleTypeFilter = (value) => {
    setSelectedTypeFilter(value);
  };

  const handleDateFilter = (dates) => {
    setSelectedDateRange(dates);
    setSelectedPredefinedRange(null);
  };

  const handleBranchFilter = (value) => {
    setSelectedBranchFilter(value);
  };

  const handlePredefinedRangeFilter = (value) => {
    setSelectedPredefinedRange(value);
    setSelectedDateRange(null);
    let dateRange = null;
    const today = dayjs();

    switch (value) {
      case "today":
        dateRange = [today, today];
        break;
      case "yesterday":
        dateRange = [today.subtract(1, "day"), today.subtract(1, "day")];
        break;
      case "last7days":
        dateRange = [today.subtract(6, "day"), today];
        break;
      case "last30days":
        dateRange = [today.subtract(29, "day"), today];
        break;
      default:
        break;
    }

    setSelectedDateRange(dateRange);
  };

  const clearFilters = () => {
    setSelectedSourceFilter(null);
    setSelectedTypeFilter(null);
    setSelectedDateRange(null);
    setSelectedPredefinedRange(null);
    setSelectedBranchFilter(null);
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Payment History</title>
          <style>
            @media print {
              @page { size: A4; margin: 20mm; }
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Payment History</h1>
          <table>
            <thead>
              <tr>
                <th>Serial No</th>
                <th>Date</th>
                <th>Type</th>
                <th>Source</th>
                <th>Branch</th>
                <th>Amount (₹)</th>
                <th>Expense Category</th>
                <th>Remarks</th>
                <th>Updated By</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions
                .map(
                  (t, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${dayjs(t.date).local().format("YYYY-MM-DD HH:mm:ss")}</td>
                      <td>${t.type}</td>
                      <td>${t.source}</td>
                      <td>${t.branch}</td>
                      <td>₹${t.amount.toFixed(2)}</td>
                      <td>${t.expenseCategory || "N/A"}</td>
                      <td>${t.remarks || "N/A"}</td>
                      <td>${t.updatedByBranch}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } else {
      message.error("Unable to open print window. Please allow pop-ups.");
    }
  };

  const columns = [
    {
      title: "Serial No",
      key: "serial_no",
      render: (_, __, index) => index + 1,
      width: 80,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => (date ? dayjs(date).local().format("YYYY-MM-DD HH:mm:ss") : "N/A"),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
    },
    {
      title: "Branch",
      dataIndex: "branch",
      key: "branch",
    },
    {
      title: "Amount (₹)",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => `₹${Number(amount).toFixed(2)}`,
    },
    {
      title: "Expense Category",
      dataIndex: "expenseCategory",
      key: "expenseCategory",
      render: (category) => category || "N/A",
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      render: (remarks) => remarks || "N/A",
    },
    {
      title: "Updated By",
      dataIndex: "updatedByBranch",
      key: "updatedByBranch",
      width: 120,
    },
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { weight: "bold" },
        },
      },
      title: {
        display: true,
        text:
          selectedDateRange || selectedPredefinedRange
            ? `Daily Credit and Debit Totals - ${selectedPredefinedRange || "Custom Range"}`
            : `Daily Credit and Debit Totals - ${dayjs().format("MMMM YYYY")}`,
        font: { weight: "bold" },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const datasetLabel = context.dataset.label || "";
            const value = context.parsed.y || 0;
            return `${datasetLabel}: ₹${value.toFixed(2)}`;
          },
          footer: (tooltipItems) => {
            const dayIndex = tooltipItems[0]?.dataIndex;
            if (
              dayIndex !== undefined &&
              chartData?.datasets?.[0]?.data &&
              chartData?.datasets?.[1]?.data
            ) {
              const total =
                (chartData.datasets[0].data[dayIndex] || 0) +
                (chartData.datasets[1].data[dayIndex] || 0);
              return `Total: ₹${total.toFixed(2)}`;
            }
            return "";
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
          font: { weight: "bold" },
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        title: {
          display: true,
          text: "Amount (₹)",
          font: { weight: "bold" },
        },
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value}`,
        },
      },
    },
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f0f2f5, #e6e9f0)",
      }}
    >
      <div
        style={{
          padding: "40px 20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div style={{ maxWidth: "1200px", width: "100%" }}>
          <Title
            level={2}
            style={{
              marginBottom: "40px",
              color: "#1a90ff",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Expense History
          </Title>
          {loading ? (
            <div style={{ textAlign: "center", padding: "100px" }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              <Card
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  background: '#fff',
                  marginBottom: '20px',
                }}
              >
                {chartData && chartData.labels?.length > 0 ? (
                  <div style={{ height: "400px", width: "100%" }}>
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                ) : (
                  <Text style={{ display: "block", textAlign: "center", padding: "20px" }}>
                    No data to display for the chart
                  </Text>
                )}
              </Card>

              <Card
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  background: '#fff',
                  marginBottom: '20px',
                }}
              >
                <Space wrap style={{ marginBottom: "20px", width: "100%" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <Text strong style={{ marginBottom: "5px" }}>
                      Source
                    </Text>
                    <Select
                      placeholder="Filter by Source"
                      value={selectedSourceFilter}
                      onChange={handleSourceFilter}
                      allowClear
                      style={{ width: "200px" }}
                    >
                      <Option value="Bank A">Bank A</Option>
                      <Option value="Bank B">Bank B</Option>
                      <Option value="Bank C">Bank C</Option>
                      <Option value="Cash-in-Hand">Cash-in-Hand</Option>
                    </Select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <Text strong style={{ marginBottom: "5px" }}>
                      Branch
                    </Text>
                    <Select
                      placeholder="Filter by Branch"
                      value={selectedBranchFilter}
                      onChange={handleBranchFilter}
                      allowClear
                      style={{ width: "200px" }}
                    >
                      {branches.map((branch) => (
                        <Option key={branch._id} value={branch._id}>
                          {branch.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <Text strong style={{ marginBottom: "5px" }}>
                      Type
                    </Text>
                    <Select
                      placeholder="Filter by Type"
                      value={selectedTypeFilter}
                      onChange={handleTypeFilter}
                      allowClear
                      style={{ width: "200px" }}
                    >
                      <Option value="Credit - Deposit">Credit - Deposit</Option>
                      <Option value="Debit - Expense">Debit - Expense</Option>
                    </Select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <Text strong style={{ marginBottom: "5px" }}>
                      Predefined Date Range
                    </Text>
                    <Select
                      placeholder="Select Range"
                      value={selectedPredefinedRange}
                      onChange={handlePredefinedRangeFilter}
                      allowClear
                      style={{ width: "200px" }}
                    >
                      <Option value="today">Today</Option>
                      <Option value="yesterday">Yesterday</Option>
                      <Option value="last7days">Last 7 Days</Option>
                      <Option value="last30days">Last 30 Days</Option>
                    </Select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <Text strong style={{ marginBottom: "5px" }}>
                      Custom Date Range
                    </Text>
                    <RangePicker
                      value={selectedDateRange}
                      onChange={handleDateFilter}
                      format="YYYY-MM-DD"
                      style={{ width: "250px" }}
                    />
                  </div>
                  <Space style={{ marginTop: "20px" }}>
                    <Button icon={<PrinterOutlined />} onClick={handlePrint} />
                    <Button type="default" icon={<ClearOutlined />} onClick={clearFilters}>
                      Reset
                    </Button>
                  </Space>
                </Space>

                <Table
                  columns={columns}
                  dataSource={filteredTransactions}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  bordered
                  loading={loading}
                />
              </Card>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PaymentHistory;