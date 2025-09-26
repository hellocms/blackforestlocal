import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { jwtDecode } from "jwt-decode";
import { Button, Table, Select, DatePicker, Space, message, Typography } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

const TimingReportPage = () => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [filteredWaiters, setFilteredWaiters] = useState([]);
  const [branchFilter, setBranchFilter] = useState("All");
  const [waiterFilter, setWaiterFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("Today");
  const [customDateRange, setCustomDateRange] = useState([dayjs(), dayjs()]);
  const [loading, setLoading] = useState(false);

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
  }, [router]);

  const fetchOrders = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders?tab=billing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(data);
        setFilteredOrders(data);
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

  const handleClearFilters = () => {
    setBranchFilter("All");
    setWaiterFilter("All");
    setDateFilter("Today");
    setCustomDateRange([dayjs(), dayjs()]);
    message.success("Filters cleared");
  };

  const getFilteredWaiters = () => {
    let filteredOrders = orders;

    let dateRange = [null, null];
    if (dateFilter === "Today") {
      dateRange = [dayjs().startOf("day"), dayjs().endOf("day")];
    } else if (dateFilter === "Yesterday") {
      dateRange = [dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")];
    } else if (dateFilter === "Last 7 Days") {
      dateRange = [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")];
    } else if (dateFilter === "Till Now") {
      dateRange = [dayjs().startOf("month"), dayjs().endOf("day")];
    } else if (dateFilter === "Custom Date" && customDateRange[0]) {
      dateRange = [
        customDateRange[0].startOf("day"),
        customDateRange[1] ? customDateRange[1].endOf("day") : customDateRange[0].endOf("day")
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

  useEffect(() => {
    let filtered = [...orders];

    if (branchFilter !== "All") {
      filtered = filtered.filter((order) =>
        order.branchId && order.branchId._id === branchFilter
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
    } else if (dateFilter === "Till Now") {
      dateRange = [dayjs().startOf("month"), dayjs().endOf("day")];
    } else if (dateFilter === "Custom Date" && customDateRange[0]) {
      dateRange = [
        customDateRange[0].startOf("day"),
        customDateRange[1] ? customDateRange[1].endOf("day") : customDateRange[0].endOf("day")
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

    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    setFilteredOrders(filtered);

    // Update filtered waiters when branch or date range changes
    setFilteredWaiters(getFilteredWaiters());
  }, [branchFilter, waiterFilter, dateFilter, customDateRange, orders]);

  const getHourlyData = () => {
    const hourlySums = Array(24).fill(0);

    filteredOrders.forEach((order) => {
      if (order.createdAt) {
        const hour = dayjs(order.createdAt).hour();
        hourlySums[hour] += order.totalWithGST || 0;
      }
    });

    let minHour = 23;
    let maxHour = 0;
    hourlySums.forEach((sum, hour) => {
      if (sum > 0) {
        if (hour < minHour) minHour = hour;
        if (hour > maxHour) maxHour = hour;
      }
    });

    if (minHour > maxHour) return { dataSource: [], columns: [] };

    const hourSlots = [];
    const selectedSums = [];
    for (let hour = minHour; hour <= maxHour; hour++) {
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const nextDisplayHour = (hour + 1) % 12 === 0 ? 12 : (hour + 1) % 12;
      const ampm = hour < 12 ? "AM" : "PM";
      hourSlots.push(`${displayHour}-${nextDisplayHour} ${ampm}`);
      selectedSums.push(hourlySums[hour]);
    }

    const hoursRow = { key: 'hours', label: 'Hours' };
    const amountRow = { key: 'amount', label: 'Amount' };

    for (let i = 0; i < hourSlots.length; i++) {
      const col = `col${i}`;
      hoursRow[col] = hourSlots[i];
      amountRow[col] = `₹${selectedSums[i].toFixed(2)}`;
    }

    // Add total column
    const totalCol = `col${hourSlots.length}`;
    const totalAmount = selectedSums.reduce((sum, val) => sum + val, 0);
    hoursRow[totalCol] = 'Total';
    amountRow[totalCol] = `₹${totalAmount.toFixed(2)}`;

    const dataSource = [hoursRow, amountRow];

    const columns = [
      {
        title: '',
        dataIndex: 'label',
        fixed: 'left',
        width: 100,
      },
      ...hourSlots.map((_, i) => ({
        title: '',
        dataIndex: `col${i}`,
        width: 120,
      })),
      {
        title: '',
        dataIndex: totalCol,
        width: 120,
        render: (text) => <strong>{text}</strong>,
      },
    ];

    return { dataSource, columns };
  };

  const { dataSource, columns } = getHourlyData();

  return (
    <div style={{ padding: "20px" }}>
      <Space direction="vertical" style={{ width: "100%", marginBottom: "20px" }}>
        <Space wrap style={{ marginBottom: "10px" }}>
          <Space direction="vertical">
            <Text strong>Branch:</Text>
            <Select
              value={branchFilter}
              onChange={(value) => {
                setBranchFilter(value);
                setWaiterFilter("All");
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
            <Text strong>Date Range:</Text>
            <Space>
              <Select
                value={dateFilter}
                onChange={(value) => {
                  setDateFilter(value);
                  setWaiterFilter("All");
                  if (value === "Today") {
                    setCustomDateRange([dayjs(), dayjs()]);
                  } else if (value === "Yesterday") {
                    setCustomDateRange([dayjs().subtract(1, "day"), dayjs().subtract(1, "day")]);
                  } else if (value === "Last 7 Days") {
                    setCustomDateRange([dayjs().subtract(6, "day"), dayjs()]);
                  } else if (value === "Till Now") {
                    setCustomDateRange([dayjs().startOf("month"), dayjs()]);
                  }
                }}
                style={{ width: 150 }}
              >
                <Option value="Today">Today</Option>
                <Option value="Yesterday">Yesterday</Option>
                <Option value="Last 7 Days">Last 7 Days</Option>
                <Option value="Till Now">Till Now</Option>
                <Option value="Custom Date">Custom Date</Option>
              </Select>
              <RangePicker
                format="DD/MM/YYYY"
                value={customDateRange}
                onChange={(dates) => {
                  setCustomDateRange(dates || [dayjs(), dayjs()]);
                  setDateFilter("Custom Date");
                  setWaiterFilter("All");
                }}
                style={{ width: 250 }}
              />
            </Space>
          </Space>
          <Button onClick={handleClearFilters} style={{ marginTop: 20 }}>
            Clear Filters
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={false}
          rowKey="key"
          scroll={{ x: true }}
          showHeader={false}
        />
      </Space>
    </div>
  );
};

export default TimingReportPage;