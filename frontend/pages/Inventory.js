import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Select, message, InputNumber, Tooltip, Card, Modal, Tag } from 'antd';
import { SearchOutlined, PlusOutlined, MinusOutlined, WarningOutlined, HistoryOutlined, DownloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const { Option } = Select;

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedVeg, setSelectedVeg] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkStockValue, setBulkStockValue] = useState('');
  const [historyVisible, setHistoryVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.info('Please log in to view inventory');
      router.push('/login');
    } else {
      fetchProducts(token);
      fetchInventory(token);
      fetchBranches(token);
      fetchCategories(token);
    }
  }, [router]);

  const fetchProducts = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' },
      });
      const data = await response.json();
      if (response.ok) {
        setProducts(data);
        filterProducts(searchText, selectedCategory, selectedStock, selectedVeg, selectedType, data);
      } else {
        message.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      message.error('Error fetching products');
    }
    setLoading(false);
  };

  const fetchInventory = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' },
      });
      const data = await response.json();
      if (response.ok) {
        setInventory(data);
      } else {
        message.error('Failed to fetch inventory');
      }
    } catch (error) {
      console.error('❌ Error fetching inventory:', error);
      message.error('Error fetching inventory');
    }
  };

  const fetchBranches = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/branches`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' },
      });
      const data = await response.json();
      if (response.ok) {
        setBranches(Array.isArray(data) ? data : []);
      } else {
        message.error('Failed to fetch branches');
      }
    } catch (error) {
      console.error('❌ Error fetching branches:', error);
      message.error('Error fetching branches');
    }
  };

  const fetchCategories = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/categories/list-categories`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' },
      });
      const data = await response.json();
      if (response.ok) {
        setCategories(Array.isArray(data) ? data : []);
      } else {
        message.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      message.error('Error fetching categories');
    }
  };

  const handleLocationChange = (value) => {
    setSelectedLocation(value);
    filterProducts(searchText, selectedCategory, selectedStock, selectedVeg, selectedType);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    filterProducts(value, selectedCategory, selectedStock, selectedVeg, selectedType);
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'category') setSelectedCategory(value);
    if (filterType === 'stock') setSelectedStock(value);
    if (filterType === 'veg') setSelectedVeg(value);
    if (filterType === 'type') setSelectedType(value);
    filterProducts(
      searchText,
      filterType === 'category' ? value : selectedCategory,
      filterType === 'stock' ? value : selectedStock,
      filterType === 'veg' ? value : selectedVeg,
      filterType === 'type' ? value : selectedType
    );
  };

  const filterProducts = (search, category, stock, veg, type, updatedProducts = products) => {
    let filtered = [...updatedProducts];
    if (search) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.productId.includes(search)
      );
    }
    if (category) {
      filtered = filtered.filter(product => product.category?._id === category);
    }
    if (stock) {
      if (stock === 'inStock') filtered = filtered.filter(product => getLocationStock(product._id) > 0);
      if (stock === 'lowStock') filtered = filtered.filter(product => {
        const stock = getLocationStock(product._id);
        return stock > 0 && stock <= (getFactoryThreshold(product._id) || 5);
      });
      if (stock === 'outStock') filtered = filtered.filter(product => getLocationStock(product._id) === 0);
    }
    if (veg) {
      filtered = filtered.filter(product => product.isVeg === (veg === 'veg'));
    }
    if (type) {
      filtered = filtered.filter(product => product.productType === type);
    }
    setFilteredProducts(filtered);
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedCategory(null);
    setSelectedStock(null);
    setSelectedVeg(null);
    setSelectedType(null);
    setFilteredProducts([...products]);
  };

  const getFactoryStock = (productId) => {
    const factoryInv = inventory.find(inv => inv.productId._id === productId && !inv.locationId);
    return factoryInv ? factoryInv.inStock : 0;
  };

  const getBranchStock = (productId, branchId) => {
    const branchInv = inventory.find(inv => inv.productId._id === productId && inv.locationId === branchId);
    return branchInv ? branchInv.inStock : 0;
  };

  const getTotalBranchStock = (productId) => {
    const branchInv = inventory.filter(inv => inv.productId._id === productId && inv.locationId);
    return branchInv.reduce((sum, inv) => sum + inv.inStock, 0);
  };

  const getLocationStock = (productId) => {
    if (selectedLocation === 'all') {
      return getFactoryStock(productId) + getTotalBranchStock(productId);
    } else if (selectedLocation === 'factory') {
      return getFactoryStock(productId);
    } else {
      return getBranchStock(productId, selectedLocation);
    }
  };

  const getFactoryThreshold = (productId) => {
    const factoryInv = inventory.find(inv => inv.productId._id === productId && !inv.locationId);
    return factoryInv ? factoryInv.lowStockThreshold : 5;
  };

  const getInventoryId = (productId, locationId) => {
    const inv = inventory.find(inv => 
      inv.productId._id === productId && 
      (locationId === 'factory' ? !inv.locationId : inv.locationId === locationId)
    );
    return inv ? inv._id : null;
  };

  const updateStock = async (productId, newStock, reason, locationId = 'factory') => {
    if (selectedLocation === 'all') {
      message.warning('Please select a specific location to update stock');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const inventoryId = getInventoryId(productId, locationId);
      const factoryInventoryId = getInventoryId(productId, 'factory');

      if (locationId !== 'factory' && newStock > getFactoryStock(productId)) {
        message.warning('Insufficient stock in Factory to transfer');
        return;
      }

      if (!inventoryId) {
        const response = await fetch(`${BACKEND_URL}/api/inventory/transfer`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            productId, 
            quantity: newStock, 
            reason, 
            locationId: locationId === 'factory' ? null : locationId,
            factoryInventoryId
          }),
        });
        if (response.ok) {
          message.success('✅ Stock updated successfully');
        } else {
          message.error('❌ Failed to update stock');
          return;
        }
      } else {
        const response = await fetch(`${BACKEND_URL}/api/inventory/${inventoryId}/stock`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            inStock: newStock, 
            reason,
            factoryInventoryId: locationId !== 'factory' ? factoryInventoryId : undefined
          }),
        });
        if (response.ok) {
          message.success('✅ Stock updated successfully');
        } else {
          message.error('❌ Failed to update stock');
          return;
        }
      }
      await fetchInventory(token);
      await fetchProducts(token);
    } catch (error) {
      console.error('❌ Error updating stock:', error);
      message.error('Error updating stock');
    }
  };

  const updateThreshold = async (productId, newThreshold) => {
    if (selectedLocation !== 'factory') {
      message.warning('Threshold can only be updated for Factory');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const inventoryId = getInventoryId(productId, 'factory');
      if (!inventoryId) {
        message.warning('No factory inventory exists to update threshold');
        return;
      }
      const response = await fetch(`${BACKEND_URL}/api/inventory/${inventoryId}/threshold`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ lowStockThreshold: newThreshold }),
      });
      if (response.ok) {
        message.success('✅ Threshold updated successfully');
        await fetchInventory(token);
      } else {
        message.error('❌ Failed to update threshold');
      }
    } catch (error) {
      console.error('❌ Error updating threshold:', error);
      message.error('Error updating threshold');
    }
  };

  const bulkUpdateStock = async () => {
    if (selectedLocation === 'all') {
      message.warning('Please select a specific location for bulk update');
      return;
    }
    if (!bulkStockValue || selectedRowKeys.length === 0) {
      message.warning('Please select products and enter a stock value to add');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        selectedRowKeys.map(async (productId) => {
          const currentStock = selectedLocation === 'factory' 
            ? getFactoryStock(productId) 
            : getBranchStock(productId, selectedLocation);
          const newStock = currentStock + Number(bulkStockValue);
          await updateStock(productId, newStock, 'Bulk Update', selectedLocation);
        })
      );
      message.success('✅ Bulk stock added successfully');
      setSelectedRowKeys([]);
      setBulkStockValue('');
    } catch (error) {
      console.error('❌ Error updating bulk stock:', error);
      message.error('Error updating bulk stock');
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const totalStock = filteredProducts.reduce((sum, product) => sum + getLocationStock(product._id), 0);
  const lowStockCount = filteredProducts.filter(product => {
    const stock = getLocationStock(product._id);
    return stock > 0 && stock <= (getFactoryThreshold(product._id) || 5);
  }).length;
  const outOfStockCount = filteredProducts.filter(product => getLocationStock(product._id) === 0).length;

  const csvData = filteredProducts.map(product => ({
    ID: product.productId,
    Name: product.name,
    Category: product.category?.name || '',
    Stock: getLocationStock(product._id),
    'Low Stock Threshold': selectedLocation === 'factory' ? getFactoryThreshold(product._id) : 'N/A',
    'Last Updated': new Date(product.updatedAt).toLocaleString(),
  }));

  const downloadCSV = () => {
    if (!csvData || csvData.length === 0) {
      message.warning('No data available to download');
      return;
    }
    const filename = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { title: 'ID', dataIndex: 'productId', key: 'productId', width: 80 },
    { 
      title: 'Veg', 
      dataIndex: 'isVeg', 
      key: 'isVeg', 
      width: 60, 
      render: (isVeg) => (
        <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: isVeg ? 'green' : 'red' }} />
      ),
    },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: ['category', 'name'], key: 'category' },
    { 
      title: 'Stock', 
      key: 'stock', 
      render: (_, record) => {
        const stock = getLocationStock(record._id);
        if (selectedLocation !== 'all') {
          return (
            <Space>
              <Button 
                size="small" 
                icon={<MinusOutlined />} 
                onClick={() => updateStock(record._id, Math.max(0, stock - 1), 'Decremented', selectedLocation)} 
                disabled={stock <= 0} 
              />
              <InputNumber 
                min={0} 
                value={stock} 
                onChange={(value) => updateStock(record._id, value || 0, 'Manual Edit', selectedLocation)} 
                style={{ width: '60px' }} 
                controls={false} 
              />
              <Button 
                size="small" 
                icon={<PlusOutlined />} 
                onClick={() => updateStock(record._id, stock + 1, 'Incremented', selectedLocation)} 
                disabled={selectedLocation !== 'factory' && getFactoryStock(record._id) <= 0}
              />
              {stock <= (getFactoryThreshold(record._id) || 5) && stock > 0 && (
                <Tooltip title="Low Stock - Consider Restocking">
                  <Tag color="yellow" icon={<WarningOutlined />}>Low</Tag>
                </Tooltip>
              )}
              {stock === 0 && (
                <Tooltip title="Out of Stock">
                  <Tag color="red" icon={<WarningOutlined />}>Out</Tag>
                </Tooltip>
              )}
            </Space>
          );
        } else {
          return stock;
        }
      },
    },
    { 
      title: 'Alert', 
      key: 'lowStockThreshold', 
      width: 100, 
      render: (_, record) => {
        if (selectedLocation === 'factory') {
          const threshold = getFactoryThreshold(record._id);
          return (
            <InputNumber 
              min={1} 
              value={threshold} 
              onChange={(value) => updateThreshold(record._id, value || 5)} 
              style={{ width: '60px' }} 
              controls={false} 
            />
          );
        }
        return 'N/A';
      },
    },
    { 
      title: 'History', 
      key: 'history', 
      width: 80, 
      render: (_, record) => (
        <Button 
          size="small" 
          icon={<HistoryOutlined />} 
          onClick={() => {
            const inv = selectedLocation === 'factory' 
              ? inventory.find(inv => inv.productId._id === record._id && !inv.locationId)
              : inventory.find(inv => inv.productId._id === record._id && inv.locationId === selectedLocation);
            setSelectedItem(inv || { productId: record, stockHistory: [] });
            setHistoryVisible(true);
          }} 
        />
      ),
    },
  ];

  const getRowClassName = (record) => {
    const threshold = getFactoryThreshold(record._id);
    const stock = getLocationStock(record._id);
    if (stock === 0) return 'row-out-of-stock';
    if (stock <= threshold) return 'row-low-stock';
    return 'row-in-stock';
  };

  const handlePageSizeChange = (current, size) => {
    setPageSize(size);
  };

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <Space style={{ marginBottom: '20px' }}>
        <Card title="Total Stock" size="small" style={{ width: 200 }}><p>{totalStock} units</p></Card>
        <Card title="Low Stock" size="small" style={{ width: 200 }}><p>{lowStockCount} items</p></Card>
        <Card title="Out of Stock" size="small" style={{ width: 200 }}><p>{outOfStockCount} items</p></Card>
      </Space>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>Inventory ({filteredProducts.length} of {products.length})</h2>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={downloadCSV}>
            Download Report
          </Button>
        </Space>
      </div>

      <Space wrap style={{ marginBottom: '10px' }}>
        <Select
          placeholder="Select Location"
          onChange={handleLocationChange}
          value={selectedLocation}
          style={{ width: '200px' }}
        >
          <Option value="all">All Locations</Option>
          <Option value="factory">Factory</Option>
          {branches.map((branch) => (
            <Option key={branch._id} value={branch._id}>{branch.name}</Option>
          ))}
        </Select>
        <Input
          placeholder="Search by Name or ID"
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: '300px' }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="Category"
          onChange={(value) => handleFilterChange('category', value)}
          allowClear
          style={{ width: '200px' }}
          value={selectedCategory}
        >
          {categories.map((chedc) => (
            <Option key={chedc._id} value={chedc._id}>{chedc.name}</Option>
          ))}
        </Select>
        <Select
          placeholder="Stock Status"
          onChange={(value) => handleFilterChange('stock', value)}
          allowClear
          style={{ width: '150px' }}
          value={selectedStock}
        >
          <Option value="inStock">In Stock</Option>
          <Option value="lowStock">Low Stock</Option>
          <Option value="outStock">Out of Stock</Option>
        </Select>
        <Select
          placeholder="Veg/Non-Veg"
          onChange={(value) => handleFilterChange('veg', value)}
          allowClear
          style={{ width: '150px' }}
          value={selectedVeg}
        >
          <Option value="veg">Veg</Option>
          <Option value="non-veg">Non-Veg</Option>
        </Select>
        <Select
          placeholder="Type"
          onChange={(value) => handleFilterChange('type', value)}
          allowClear
          style={{ width: '150px' }}
          value={selectedType}
        >
          <Option value="cake">Cake</Option>
          <Option value="non-cake">Non-Cake</Option>
        </Select>
        <Button onClick={clearFilters}>Clear Filters</Button>
        {selectedRowKeys.length > 0 && selectedLocation !== 'all' && (
          <Space>
            <InputNumber
              min={0}
              value={bulkStockValue}
              onChange={(value) => setBulkStockValue(value)}
              placeholder="Add Stock"
              style={{ width: '100px' }}
            />
            <Button type="primary" onClick={bulkUpdateStock}>Add to Selected</Button>
          </Space>
        )}
      </Space>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={filteredProducts}
        rowKey="_id"
        loading={loading}
        pagination={{
          pageSize,
          pageSizeOptions: [10, 20, 50],
          showSizeChanger: true,
          onShowSizeChange: handlePageSizeChange,
        }}
        scroll={{ x: 'max-content' }}
        rowClassName={getRowClassName}
      />

      <Modal
        title={`${selectedItem?.productId.name} Stock History (${selectedLocation === 'factory' ? 'Factory' : branches.find(b => b._id === selectedLocation)?.name || 'All'})`}
        visible={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        footer={null}
      >
        <Table
          dataSource={selectedItem?.stockHistory || []}
          columns={[
            { title: 'Date', dataIndex: 'date', render: (date) => new Date(date).toLocaleString() },
            { title: 'Change', dataIndex: 'change', render: (change) => (change > 0 ? `+${change}` : change) },
            { title: 'Reason', dataIndex: 'reason' },
          ]}
          rowKey="_id"
          pagination={false}
        />
      </Modal>

      <style jsx>{`
        .row-in-stock { background-color: #f6ffed; }
        .row-low-stock { background-color: #fff7e6; }
        .row-out-of-stock { background-color: #fff1f0; }
      `}</style>
    </div>
  );
};

export default InventoryPage;