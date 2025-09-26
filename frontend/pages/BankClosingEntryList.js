import React, { useState, useEffect, useMemo } from 'react';
import { Table, Select, DatePicker, Button, Spin, Typography, Space, Card, Switch, Modal } from 'antd';
import { RedoOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

const { Option } = Select;
const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const BankEntryList = () => {
  const [closingEntries, setClosingEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bankFilter, setBankFilter] = useState(null);
  const [branchFilter, setBranchFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState('Till Now');
  const [customDateRange, setCustomDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('day'),
  ]);
  const [showSummaryTable, setShowSummaryTable] = useState(true);
  const [isBankPaymentsModalVisible, setIsBankPaymentsModalVisible] = useState(false);
  const [bankPaymentsDetails, setBankPaymentsDetails] = useState([]);
  const [bankPaymentsModalTitle, setBankPaymentsModalTitle] = useState('');
  const [isCashModalVisible, setIsCashModalVisible] = useState(false);
  const [cashDetails, setCashDetails] = useState([]);
  const [cashModalTitle, setCashModalTitle] = useState('');

  // Bank to Branch ObjectID Mapping
  const bankBranchMapping = {
    'IDFC 1': ['67e2e29328541a7b58d1ca11', '67ed2c7b62b722c49a251e26'],
    'IDFC 2': ['67e1a4b22191787a139a749f', '67e2e1f928541a7b58d1c9f8', '67ed2be162b722c49a251dca'],
    'IDFC 3': ['6841d8b5b5a0fc5644db5b10'],
    'IDFC 4': ['6841d9b7b5a0fc5644db5b18'],
  };

  const banks = Object.keys(bankBranchMapping);

  useEffect(() => {
    fetchBranches();
    fetchClosingEntries();
  }, []);

  useEffect(() => {
    let filtered = [...closingEntries];

    if (bankFilter) {
      const allowedBranchIds = bankBranchMapping[bankFilter] || [];
      filtered = filtered.filter((entry) => allowedBranchIds.includes(entry.branchId?._id));
    }

    if (branchFilter) {
      filtered = filtered.filter((entry) => entry.branchId?._id === branchFilter);
    }

    if (dateFilter) {
      let startDate, endDate;
      const today = dayjs().startOf('day');
      switch (dateFilter) {
        case 'Today':
          startDate = today;
          endDate = today.endOf('day');
          break;
        case 'Yesterday':
          startDate = today.subtract(1, 'day').startOf('day');
          endDate = today.subtract(1, 'day').endOf('day');
          break;
        case 'Last 7 Days':
          startDate = today.subtract(6, 'day').startOf('day');
          endDate = today.endOf('day');
          break;
        case 'Last 30 Days':
          startDate = today.subtract(29, 'day').startOf('day');
          endDate = today.endOf('day');
          break;
        case 'Till Now':
          startDate = dayjs().startOf('month');
          endDate = today.endOf('day');
          break;
        case 'Custom':
          if (customDateRange && customDateRange.length === 2) {
            startDate = dayjs(customDateRange[0]).startOf('day');
            endDate = dayjs(customDateRange[1]).endOf('day');
          }
          break;
        default:
          break;
      }
      if (startDate && endDate) {
        filtered = filtered.filter((entry) => {
          const entryDate = dayjs(entry.createdAt);
          return entryDate.isValid() && entryDate.isBetween(startDate, endDate, null, '[]');
        });
      }
    }

    setFilteredEntries(filtered);
  }, [closingEntries, bankFilter, branchFilter, dateFilter, customDateRange]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/branches/public', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        setBranches(result);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchClosingEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/closing-entries', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok) {
        setClosingEntries(result);
        setFilteredEntries(result);
      }
    } catch (err) {
      console.error('Error fetching closing entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBankPayments = (bankName) => {
    const allowedBranchIds = bankBranchMapping[bankName] || [];
    const details = filteredEntries
      .filter((entry) => allowedBranchIds.includes(entry.branchId?._id))
      .map((entry) => ({
        branchName: entry.branchId?.name || 'N/A',
        bankPayments: (entry.creditCardPayment || 0) + (entry.upiPayment || 0),
      }))
      .reduce((acc, curr) => {
        const existing = acc.find((item) => item.branchName === curr.branchName);
        if (existing) {
          existing.bankPayments += curr.bankPayments;
        } else {
          acc.push(curr);
        }
        return acc;
      }, []);
    setBankPaymentsDetails(details);
    setBankPaymentsModalTitle(`Bank Payments Breakdown for ${bankName}`);
    setIsBankPaymentsModalVisible(true);
  };

  const handleViewCash = (bankName) => {
    const allowedBranchIds = bankBranchMapping[bankName] || [];
    const details = filteredEntries
      .filter((entry) => allowedBranchIds.includes(entry.branchId?._id))
      .map((entry) => ({
        branchName: entry.branchId?.name || 'N/A',
        cashPayment: entry.cashPayment || 0,
      }))
      .reduce((acc, curr) => {
        const existing = acc.find((item) => item.branchName === curr.branchName);
        if (existing) {
          existing.cashPayment += curr.cashPayment;
        } else {
          acc.push(curr);
        }
        return acc;
      }, []);
    setCashDetails(details);
    setCashModalTitle(`Cash Payments Breakdown for ${bankName}`);
    setIsCashModalVisible(true);
  };

  const handleBankPaymentsModalClose = () => {
    setIsBankPaymentsModalVisible(false);
    setBankPaymentsDetails([]);
    setBankPaymentsModalTitle('');
  };

  const handleCashModalClose = () => {
    setIsCashModalVisible(false);
    setCashDetails([]);
    setCashModalTitle('');
  };

  const handleReset = () => {
    setBankFilter(null);
    setBranchFilter(null);
    setDateFilter('Till Now');
    setCustomDateRange([dayjs().startOf('month'), dayjs().endOf('day')]);
  };

  const handlePrint = () => {
    let printContent;
    if (showSummaryTable) {
      printContent = `
        <html>
          <head>
            <title>Bank Summary Report</title>
            <style>
              @media print {
                @page { size: A4; margin: 20mm; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #000; padding: 4px; text-align: left; font-weight: bold; }
                th { background-color: #f2f2f2; font-weight: bold; }
              }
            </style>
          </head>
          <body>
            <h1>Bank Summary Report</h1>
            <h3>Period: ${dateFilter}${dateFilter === 'Custom' && customDateRange ? ` (${dayjs(customDateRange[0]).format('D/M/YY')} to ${dayjs(customDateRange[1]).format('D/M/YY')})` : dateFilter === 'Till Now' ? ` (${dayjs().startOf('month').format('D/M/YY')} to ${dayjs().format('D/M/YY')})` : ''}</h3>
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Bank</th>
                  <th>Bank Payments</th>
                  <th>Cash</th>
                </tr>
              </thead>
              <tbody>
                ${bankTotals.map((entry, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${entry.bankName}</td>
                    <td>₹${entry.bankPayments.toFixed(2)}</td>
                    <td>₹${entry.cashPayment.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
    } else {
      printContent = `
        <html>
          <head>
            <title>Branch Entry List</title>
            <style>
              @media print {
                @page { size: A4; margin: 20mm; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #000; padding: 4px; text-align: left; font-weight: bold; }
                th { background-color: #f2f2f2; font-weight: bold; }
              }
            </style>
          </head>
          <body>
            <h1>Branch Entry List</h1>
            <h3>Period: ${dateFilter}${dateFilter === 'Custom' && customDateRange ? ` (${dayjs(customDateRange[0]).format('D/M/YY')} to ${dayjs(customDateRange[1]).format('D/M/YY')})` : dateFilter === 'Till Now' ? ` (${dayjs().startOf('month').format('D/M/YY')} to ${dayjs().format('D/M/YY')})` : ''}</h3>
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Bank</th>
                  <th>Branch</th>
                  <th>Bank Payments</th>
                  <th>Cash</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${filteredEntries.map((entry, index) => {
                  const bankName = Object.keys(bankBranchMapping).find((bank) =>
                    bankBranchMapping[bank].includes(entry.branchId?._id)
                  ) || 'Unknown Bank';
                  const bankPayments = (entry.creditCardPayment || 0) + (entry.upiPayment || 0);
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${bankName}</td>
                      <td>${entry.branchId?.name || 'N/A'}</td>
                      <td>₹${bankPayments.toFixed(2)}</td>
                      <td>₹${entry.cashPayment || 0}</td>
                      <td>${entry.createdAt ? dayjs(entry.createdAt).format('D/M/YY') : 'N/A'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const bankTotals = useMemo(() => {
    const totals = {};
    filteredEntries.forEach((entry) => {
      const branchId = entry.branchId?._id || 'Unknown Branch';
      const bankName = Object.keys(bankBranchMapping).find((bank) =>
        bankBranchMapping[bank].includes(branchId)
      ) || 'Unknown Bank';
      const bankId = bankName; // Using bankName as unique key
      if (!totals[bankId]) {
        totals[bankId] = {
          bankName,
          bankPayments: 0,
          cashPayment: 0,
        };
      }
      totals[bankId].bankPayments += (entry.creditCardPayment || 0) + (entry.upiPayment || 0);
      totals[bankId].cashPayment += entry.cashPayment || 0;
    });
    return Object.values(totals);
  }, [filteredEntries]);

  const branchCashTotals = useMemo(() => {
    const totals = {};
    filteredEntries.forEach((entry) => {
      const branchId = entry.branchId?._id || 'Unknown Branch';
      const branchName = entry.branchId?.name || 'N/A';
      if (!totals[branchId]) {
        totals[branchId] = {
          branchId,
          branchName,
          cashPayment: 0,
        };
      }
      totals[branchId].cashPayment += entry.cashPayment || 0;
    });
    return Object.values(totals);
  }, [filteredEntries]);

  const overallBankTotal = useMemo(() => {
    return bankTotals.reduce((sum, bank) => sum + bank.bankPayments, 0);
  }, [bankTotals]);

  const overallCashTotal = useMemo(() => {
    return branchCashTotals.reduce((sum, branch) => sum + branch.cashPayment, 0);
  }, [branchCashTotals]);

  const bankPaymentsColumns = [
    {
      title: 'Branch Name',
      dataIndex: 'branchName',
      key: 'branchName',
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: 'Bank Payments',
      dataIndex: 'bankPayments',
      key: 'bankPayments',
      render: (value) => <Text strong>₹{value.toFixed(2)}</Text>,
      align: 'right',
    },
  ];

  const cashColumns = [
    {
      title: 'Branch Name',
      dataIndex: 'branchName',
      key: 'branchName',
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: 'Cash Payment',
      dataIndex: 'cashPayment',
      key: 'cashPayment',
      render: (value) => <Text strong>₹{value.toFixed(2)}</Text>,
      align: 'right',
    },
  ];

  const summaryColumns = [
    {
      title: 'S.No',
      key: 'sno',
      render: (text, record, index) => <Text strong>{index + 1}</Text>,
      width: 60,
    },
    {
      title: 'Bank',
      dataIndex: 'bankName',
      key: 'bankName',
      render: (value) => <Text strong>{value}</Text>,
      width: 150,
    },
    {
      title: 'Bank Payments',
      dataIndex: 'bankPayments',
      key: 'bankPayments',
      render: (value, record) => (
        <Text
          strong
          style={{ cursor: value > 0 ? 'pointer' : 'default' }}
          onClick={() => value > 0 && handleViewBankPayments(record.bankName)}
        >
          ₹{value.toFixed(2)}
        </Text>
      ),
      width: 150,
    },
    {
      title: 'Cash',
      dataIndex: 'cashPayment',
      key: 'cashPayment',
      render: (value, record) => (
        <Text
          strong
          style={{ cursor: value > 0 ? 'pointer' : 'default' }}
          onClick={() => value > 0 && handleViewCash(record.bankName)}
        >
          ₹{value.toFixed(2)}
        </Text>
      ),
      width: 150,
    },
  ];

  const detailedColumns = [
    {
      title: 'S.No',
      key: 'sno',
      render: (text, record, index) => <Text strong>{index + 1}</Text>,
      width: 60,
    },
    {
      title: 'Bank',
      key: 'bankName',
      render: (record) => {
        const bankName = Object.keys(bankBranchMapping).find((bank) =>
          bankBranchMapping[bank].includes(record.branchId?._id)
        ) || 'Unknown Bank';
        return <Text strong>{bankName}</Text>;
      },
      width: 150,
    },
    {
      title: 'Branch',
      dataIndex: ['branchId', 'name'],
      key: 'branch',
      render: (value) => <Text strong>{value || 'N/A'}</Text>,
      width: 150,
    },
    {
      title: 'Bank Payments',
      key: 'bankPayments',
      render: (record) => {
        const bankPayments = (record.creditCardPayment || 0) + (record.upiPayment || 0);
        return <Text strong>₹{bankPayments.toFixed(2)}</Text>;
      },
      width: 150,
    },
    {
      title: 'Cash',
      dataIndex: 'cashPayment',
      key: 'cashPayment',
      render: (value) => <Text strong>₹{value || 0}</Text>,
      width: 150,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => <Text strong>{date ? dayjs(date).format('D/M/YY') : 'N/A'}</Text>,
      width: 100,
    },
  ];

  return (
    <div
      style={{
        padding: '40px 20px',
        background: 'linear-gradient(to bottom, #f0f2f5, #e6e9f0)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <style>
        {`
          @media print {
            @page { size: A4; margin: 10mm; }
            body { margin: 0; padding: 0; background: #fff; }
            .ant-table { font-size: 10px; }
            .ant-table th, .ant-table td { padding: 4px !important; font-weight: bold; line-height: 1 !important; }
            .no-print { display: none; }
          }
          .filter-header {
            background: #fff;
            margin-bottom: 20px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            border-radius: 12px;
          }
          .ant-table td, .ant-table th {
            padding: 4px !important;
            line-height: 1 !important;
          }
          .bank-button, .branch-button {
            margin: 5px;
            padding: 10px;
            border-radius: 8px;
            background: #070738;
            color: #FFFF00;
            border: none;
            width: 220px;
            height: 60px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            white-space: normal;
            overflow: visible;
          }
          .bank-button:hover, .branch-button:hover {
            background: #070738 !important;
            color: #FFFF00 !important;
          }
          .total-button {
            margin: 5px;
            padding: 10px;
            border-radius: 8px;
            background: #52c41a;
            color: #FFFF00;
            border: none;
            width: 220px;
            height: 60px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            white-space: normal;
            overflow: visible;
          }
          .total-button:hover {
            background: #52c41a !important;
            color: #FFFF00 !important;
          }
          .button-text {
            font-size: 14px;
            font-weight: 700;
            line-height: 1.2;
            color: #FFFF00;
          }
          .button-amount {
            font-size: 16px;
            font-weight: 700;
            margin-top: 4px;
            color: #FFFFFF;
          }
        `}
      </style>
      <div style={{ maxWidth: '1200px', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Card
              className="filter-header no-print"
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                marginBottom: '20px',
              }}
            >
              <Space wrap style={{ width: '100%', padding: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Bank</Text>
                  <Select
                    placeholder="All Banks"
                    value={bankFilter}
                    onChange={(value) => {
                      setBankFilter(value);
                      setBranchFilter(null); // Reset branch filter when bank changes
                    }}
                    allowClear
                    style={{ width: '200px' }}
                  >
                    {banks.map((bank) => (
                      <Option key={bank} value={bank}>
                        {bank}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Branch</Text>
                  <Select
                    placeholder="All Branches"
                    value={branchFilter}
                    onChange={(value) => setBranchFilter(value)}
                    allowClear
                    style={{ width: '200px' }}
                    disabled={bankFilter && !bankBranchMapping[bankFilter]?.length}
                  >
                    {(bankFilter ? bankBranchMapping[bankFilter] : branches.map((b) => b._id)).map((branchId) => {
                      const branch = branches.find((b) => b._id === branchId);
                      return (
                        <Option key={branchId} value={branchId}>
                          {branch?.name || branchId}
                        </Option>
                      );
                    })}
                  </Select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Date Filter</Text>
                  <Space>
                    <Select
                      value={dateFilter}
                      onChange={(value) => {
                        setDateFilter(value);
                        if (value !== 'Custom') {
                          if (value === 'Till Now') {
                            setCustomDateRange([dayjs().startOf('month'), dayjs().endOf('day')]);
                          } else {
                            setCustomDateRange(null);
                          }
                        }
                      }}
                      style={{ width: '150px' }}
                    >
                      <Option value="Till Now">Till Now</Option>
                      <Option value="Today">Today</Option>
                      <Option value="Yesterday">Yesterday</Option>
                      <Option value="Last 7 Days">Last 7 Days</Option>
                      <Option value="Last 30 Days">Last 30 Days</Option>
                      <Option value="Custom">Custom</Option>
                    </Select>
                    <RangePicker
                      value={customDateRange}
                      onChange={(dates) => setCustomDateRange(dates)}
                      format="D/M/YY"
                      style={{ width: '250px' }}
                      disabled={dateFilter !== 'Custom'}
                    />
                  </Space>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>Table View</Text>
                  <Switch
                    checked={showSummaryTable}
                    onChange={(checked) => setShowSummaryTable(checked)}
                    checkedChildren="Summary"
                    unCheckedChildren="Detailed"
                  />
                </div>
                <Space style={{ marginTop: '20px' }}>
                  <Button icon={<PrinterOutlined />} onClick={handlePrint} />
                  <Button type="default" icon={<RedoOutlined />} onClick={handleReset}>
                    Reset
                  </Button>
                </Space>
              </Space>
            </Card>
            <Card
              className="no-print"
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                marginBottom: '20px',
                background: '#f5f5f5',
              }}
            >
              <Title level={4}>Bank Payments</Title>
              <Space wrap>
                {bankTotals.map((bank) => (
                  <Button
                    key={bank.bankName}
                    className="bank-button"
                    style={{ cursor: 'default' }}
                  >
                    <div className="button-text">{bank.bankName}</div>
                    <div className="button-amount">₹{bank.bankPayments.toFixed(2)}</div>
                  </Button>
                ))}
                <Button className="total-button" style={{ cursor: 'default' }}>
                  <div className="button-text">Overall Total</div>
                  <div className="button-amount">₹{overallBankTotal.toFixed(2)}</div>
                </Button>
              </Space>
              <Title level={4} style={{ marginTop: '20px' }}>Cash in Hand</Title>
              <Space wrap>
                {branchCashTotals.map((branch) => (
                  <Button
                    key={branch.branchId}
                    className="branch-button"
                    style={{ cursor: 'default' }}
                  >
                    <div className="button-text">{branch.branchName}</div>
                    <div className="button-amount">₹{branch.cashPayment.toFixed(2)}</div>
                  </Button>
                ))}
                <Button className="total-button" style={{ cursor: 'default' }}>
                  <div className="button-text">Overall Total</div>
                  <div className="button-amount">₹{overallCashTotal.toFixed(2)}</div>
                </Button>
              </Space>
            </Card>
            <Card
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                background: '#fff',
              }}
            >
              <Table
                columns={showSummaryTable ? summaryColumns : detailedColumns}
                dataSource={showSummaryTable ? bankTotals : filteredEntries}
                rowKey={showSummaryTable ? 'bankName' : '_id'}
                pagination={{ pageSize: 10 }}
                bordered
                summary={(data) => {
                  if (!data.length) return null;
                  const totals = data.reduce(
                    (acc, record) => {
                      if (showSummaryTable) {
                        acc.bankPayments += record.bankPayments || 0;
                        acc.cashPayment += record.cashPayment || 0;
                      } else {
                        acc.bankPayments += (record.creditCardPayment || 0) + (record.upiPayment || 0);
                        acc.cashPayment += record.cashPayment || 0;
                      }
                      return acc;
                    },
                    {
                      bankPayments: 0,
                      cashPayment: 0,
                    }
                  );

                  return (
                    <Table.Summary.Row style={{ backgroundColor: '#2c3e50', color: '#ffffff' }}>
                      <Table.Summary.Cell index={0}>
                        <Text strong style={{ fontSize: '12px', color: '#ffffff' }}>Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        {showSummaryTable ? null : <Text strong style={{ color: '#ffffff' }} />}
                      </Table.Summary.Cell>
                      {showSummaryTable ? null : <Table.Summary.Cell index={2} />}
                      <Table.Summary.Cell index={showSummaryTable ? 2 : 3}>
                        <Text strong style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                          ₹{totals.bankPayments.toFixed(2)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={showSummaryTable ? 3 : 4}>
                        <Text strong style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                          ₹{totals.cashPayment.toFixed(2)}
                        </Text>
                      </Table.Summary.Cell>
                      {showSummaryTable ? null : <Table.Summary.Cell index={5} />}
                    </Table.Summary.Row>
                  );
                }}
              />
            </Card>
            <Modal
              title={bankPaymentsModalTitle}
              open={isBankPaymentsModalVisible}
              onCancel={handleBankPaymentsModalClose}
              footer={null}
              width={600}
            >
              {bankPaymentsDetails.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text>No bank payment details available.</Text>
                </div>
              ) : (
                <Table
                  columns={bankPaymentsColumns}
                  dataSource={bankPaymentsDetails}
                  rowKey={(record, index) => index}
                  pagination={false}
                  bordered
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} align="right">
                        <Text strong>Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong>
                          ₹{bankPaymentsDetails.reduce((sum, item) => sum + (item.bankPayments || 0), 0).toFixed(2)}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              )}
            </Modal>
            <Modal
              title={cashModalTitle}
              open={isCashModalVisible}
              onCancel={handleCashModalClose}
              footer={null}
              width={600}
            >
              {cashDetails.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text>No cash payment details available.</Text>
                </div>
              ) : (
                <Table
                  columns={cashColumns}
                  dataSource={cashDetails}
                  rowKey={(record, index) => index}
                  pagination={false}
                  bordered
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} align="right">
                        <Text strong>Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong>
                          ₹{cashDetails.reduce((sum, item) => sum + (item.cashPayment || 0), 0).toFixed(2)}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              )}
            </Modal>
          </>
        )}
      </div>
    </div>
  );
};

export default BankEntryList;