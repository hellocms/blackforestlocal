import React, { useState, useEffect } from 'react';
import { Row, Col, Image, Button, Typography, Input, Checkbox } from 'antd';
import { ShoppingCartOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Store = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showImages, setShowImages] = useState(true);
  const [loading, setLoading] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/categories/list-categories`);
      const data = await response.json();
      setCategories(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`);
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setFilteredProducts(products.filter(product => product.category?._id === categoryId));
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
    if (!value) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => product.name.toLowerCase().includes(value.toLowerCase()));
      setFilteredProducts(filtered);
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setFilteredProducts(products);
  };

  const toggleImages = () => {
    setShowImages(!showImages);
  };

  return (
    <div>
      <Row justify="center" style={{ background: '#f0f2f5', padding: '10px 0' }}>
        <Col span={24} style={{ textAlign: 'center' }}>
          <Title level={4}>Store Dashboard</Title>
          <Checkbox checked={showImages} onChange={toggleImages}>Show Product Images</Checkbox>
        </Col>
      </Row>
      <Row style={{ background: '#f0f2f5', minHeight: '100vh' }}>
        <Col span={3} style={{ background: '#fff' }}>
          {categories.map(category => (
            <div key={category._id} onClick={() => handleCategoryClick(category._id)} style={{ padding: '10px', cursor: 'pointer' }}>
              {category.name}
            </div>
          ))}
        </Col>
        <Col span={17} style={{ padding: '10px' }}>
          <Input
            placeholder="Search products..."
            value={searchText}
            onChange={handleSearch}
            suffix={searchText ? <CloseCircleOutlined onClick={clearSearch} style={{ color: 'red' }} /> : null}
            style={{ marginBottom: '10px' }}
          />
          <Row gutter={[16, 16]}>
            {filteredProducts.map(product => (
              <Col key={product._id} xs={12} sm={8} md={5} lg={4} xl={4}>
                <div style={{ background: '#fff', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Title level={5} style={{ marginBottom: '0', fontWeight: 'bold' }}>{product.name}</Title>
                  {showImages && (
                    <Image
                      src={`${BACKEND_URL}/uploads/${product.images[0]}`}
                      alt={product.name}
                      style={{ width: '100%', height: 'auto', objectFit: 'cover', marginTop: '10px' }}
                      fallback="https://via.placeholder.com/150"
                    />
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '5px' }}>
                    <span>{`₹${product.priceDetails[0]?.price}`}</span>
                    <Button type="link" icon={<ShoppingCartOutlined />} />
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Col>
        <Col span={4} style={{ background: '#fff' }}>Cart</Col>
      </Row>
    </div>
  );
};

Store.useLayout = false;
export default Store;
