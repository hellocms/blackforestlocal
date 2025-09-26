import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, message, Row, Col, Card, Upload, Checkbox, Switch } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const { TextArea } = Input;
const { Option } = Select;

const ProductForm = () => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [imageList, setImageList] = useState([]);
  const [priceDetails, setPriceDetails] = useState([]);
  const [available, setAvailable] = useState(true);
  const [isCakeProduct, setIsCakeProduct] = useState(false);
  const [isVeg, setIsVeg] = useState(true);
  const [isPastry, setIsPastry] = useState(false);
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/categories/list-categories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setCategories(Array.isArray(data) ? data : []);
      } else {
        message.error('Failed to fetch categories');
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Error fetching categories');
      setCategories([]);
    }
  };

  const fetchDealers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/dealers`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setDealers(Array.isArray(data) ? data : []);
      } else {
        message.error('Failed to fetch dealers');
        setDealers([]);
      }
    } catch (error) {
      console.error('Error fetching dealers:', error);
      message.error('Error fetching dealers');
      setDealers([]);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/companies`);
      const data = await response.json();
      if (response.ok) {
        setCompanies(Array.isArray(data) ? data : []);
      } else {
        message.error('Failed to fetch companies');
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      message.error('Error fetching companies');
      setCompanies([]);
    }
  };

  const fetchAlbums = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/albums`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setAlbums(Array.isArray(data) ? data : []);
      } else {
        message.error('Failed to fetch albums');
        setAlbums([]);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
      message.error('Error fetching albums');
      setAlbums([]);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchDealers();
    fetchCompanies();
    fetchAlbums();
  }, []);

  // Filter categories based on isPastry and isCakeProduct
  const filteredCategories = (() => {
    if (isPastry && isCakeProduct) {
      return categories.filter(category => category.isBiling);
    } else if (isPastry) {
      return categories.filter(category => category.isPastryProduct);
    } else if (isCakeProduct) {
      return categories.filter(category => category.isCake);
    } else {
      return categories.filter(category => category.isBiling);
    }
  })();

  const handlePriceChange = (index, field, value) => {
    const updatedDetails = [...priceDetails];
    if (field === 'price' || field === 'rate' || field === 'offerPercent' || field === 'quantity') {
      const numericValue = value.replace(/[^0-9]/g, '');
      updatedDetails[index] = { ...updatedDetails[index], [field]: numericValue };
    } else {
      updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    }
    setPriceDetails(updatedDetails);
  };

  const onFinish = async (values) => {
    console.log('🚀 Creating Product:', values);

    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('category', values.category);
    formData.append('dealers', JSON.stringify(values.dealers || []));
    formData.append('company', values.company || '');
    if (isCakeProduct && values.album) {
      formData.append('album', values.album);
    }
    formData.append('description', values.description || '');
    formData.append('foodNotes', values.foodNotes || '');
    formData.append('ingredients', values.ingredients || '');
    formData.append('available', available);
    formData.append('isVeg', isVeg);
    formData.append('isPastry', isPastry);
    formData.append('isCakeProduct', isCakeProduct);

    imageList.forEach((file) => {
      if (file.originFileObj) {
        formData.append('images', file.originFileObj);
      }
    });

    formData.append('priceDetails', JSON.stringify(priceDetails));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await response.json();
      console.log('📥 Server Response:', responseData);

      if (response.ok) {
        message.success('✅ Product created successfully!');
        router.push('/products/List');
      } else {
        message.error(`❌ Error: ${responseData.message || 'Failed to create product'}`);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      message.error('❌ Unable to reach the server.');
    }
  };

  const getFirstName = (dealerName) => {
    if (!dealerName) return 'Unknown';
    const parts = dealerName.split(' ');
    return parts[0] || dealerName;
  };

  const dropdownWidth = Math.min(200 + dealers.length * 10, 600);
  const companyDropdownWidth = Math.min(200 + companies.length * 10, 600);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>Add New Product</h2>
        <Row align="middle">
          <Checkbox
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            style={{ marginRight: '8px' }}
          >
            Product is Available
          </Checkbox>
          <Checkbox
            checked={isCakeProduct}
            onChange={(e) => {
              setIsCakeProduct(e.target.checked);
              form.setFieldsValue({ category: undefined }); // Reset category when isCakeProduct changes
            }}
            style={{ marginRight: '8px' }}
          >
            Enable Cake Product
          </Checkbox>
          <Checkbox
            checked={isPastry}
            onChange={(e) => {
              setIsPastry(e.target.checked);
              form.setFieldsValue({ category: undefined }); // Reset category when isPastry changes
            }}
            style={{ marginRight: '20px' }}
          >
            Pastry
          </Checkbox>
          <Switch
            checked={isVeg}
            onChange={(checked) => setIsVeg(checked)}
            checkedChildren="Veg"
            unCheckedChildren="Non-Veg"
            style={{ backgroundColor: isVeg ? '#52c41a' : '#ff4d4f' }}
          />
        </Row>
      </Row>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Product Name"
          name="name"
          rules={[{ required: true, message: 'Please enter product name!' }]}
          style={{ marginBottom: '8px' }}
        >
          <Input placeholder="Enter product name" />
        </Form.Item>

        <Form.Item
          label="Company"
          name="company"
          style={{ marginBottom: '8px' }}
        >
          <Select
            placeholder="Select Company"
            showSearch
            allowClear
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: 'auto', minWidth: companyDropdownWidth, maxWidth: '100%' }}
          >
            {companies.map(company => (
              <Option key={company._id} value={company._id}>
                {company.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Dealers"
          name="dealers"
          rules={[{ required: true, message: 'Please select at least one dealer!' }]}
          style={{ marginBottom: '8px' }}
        >
          <Select
            mode="multiple"
            placeholder="Select Dealers"
            showSearch
            filterOption={(input, option) =>
              getFirstName(option.label).toLowerCase().includes(input.toLowerCase())
            }
            dropdownRender={() => (
              <div style={{ padding: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {dealers.map(dealer => (
                  <div key={dealer._id} style={{ marginBottom: '4px' }}>
                    <Checkbox
                      value={dealer._id}
                      checked={form.getFieldValue('dealers')?.includes(dealer._id)}
                      onChange={(e) => {
                        const currentDealers = form.getFieldValue('dealers') || [];
                        const newDealers = e.target.checked
                          ? [...currentDealers, dealer._id]
                          : currentDealers.filter(id => id !== dealer._id);
                        form.setFieldsValue({ dealers: newDealers });
                      }}
                      title={dealer.dealer_name}
                    >
                      {getFirstName(dealer.dealer_name)}
                    </Checkbox>
                  </div>
                ))}
              </div>
            )}
            style={{ width: 'auto', minWidth: dropdownWidth, maxWidth: '100%' }}
            dropdownStyle={{ minWidth: dropdownWidth }}
          >
            {dealers.map(dealer => (
              <Option key={dealer._id} value={dealer._id} label={dealer.dealer_name}>
                {getFirstName(dealer.dealer_name)}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={12}>
          <Col span={isCakeProduct ? 12 : 24}>
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: 'Please select a category!' }]}
              style={{ marginBottom: '8px' }}
            >
              <Select placeholder="Select Category">
                {Array.isArray(filteredCategories) && filteredCategories.length > 0 ? (
                  filteredCategories.map(category => (
                    <Option key={category._id} value={category._id}>{category.name}</Option>
                  ))
                ) : (
                  <Option disabled>No matching categories available</Option>
                )}
              </Select>
            </Form.Item>
          </Col>
          {isCakeProduct && (
            <Col span={12}>
              <Form.Item
                label="Album"
                name="album"
                rules={[{ required: true, message: 'Please select an album!' }]}
                style={{ marginBottom: '8px' }}
              >
                <Select placeholder="Select Album">
                  {Array.isArray(albums) && albums.length > 0 ? (
                    albums.map(album => (
                      <Option key={album._id} value={album._id}>{album.name}</Option>
                    ))
                  ) : (
                    <Option disabled>No albums available</Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
          )}
        </Row>

        <Form.Item label="Description" name="description">
          <TextArea placeholder="Description of product" rows={2} />
        </Form.Item>

        <Form.Item label="Food Notes" name="foodNotes">
          <TextArea placeholder="Footnote of product" rows={2} />
        </Form.Item>

        <Form.Item label="Ingredients" name="ingredients">
          <Input placeholder="Enter ingredients (comma-separated)" />
        </Form.Item>

        <Form.Item label="Product Images">
          <Upload
            listType="picture-card"
            fileList={imageList}
            beforeUpload={(file) => {
              setImageList([...imageList, file]);
              return false;
            }}
            onChange={({ fileList }) => setImageList(fileList)}
            onRemove={(file) => {
              setImageList(imageList.filter((item) => item.uid !== file.uid));
            }}
          >
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>
        </Form.Item>

        <Button
          type="dashed"
          onClick={() =>
            setPriceDetails([
              ...priceDetails,
              { price: '', rate: '', offerPercent: '', quantity: '', unit: '', gst: 0, cakeType: '' }
            ])
          }
          style={{ marginBottom: '8px' }}
        >
          Add Price Details
        </Button>
        {priceDetails.map((detail, index) => (
          <Card key={index} style={{ marginBottom: '8px' }}>
            <Row gutter={8}>
              <Col span={4}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>Price (MRP)</div>
                <Input
                  placeholder="Price (MRP)"
                  value={detail.price}
                  onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
                  type="text"
                />
              </Col>
              <Col span={4}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>Rate</div>
                <Input
                  placeholder="Rate"
                  value={detail.rate}
                  onChange={(e) => handlePriceChange(index, 'rate', e.target.value)}
                  type="text"
                />
              </Col>
              <Col span={3}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>Offer %</div>
                <Input
                  placeholder="Offer %"
                  value={detail.offerPercent}
                  onChange={(e) => handlePriceChange(index, 'offerPercent', e.target.value)}
                  type="text"
                />
              </Col>
              <Col span={3}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>Quantity</div>
                <Input
                  placeholder="Quantity"
                  value={detail.quantity}
                  onChange={(e) => handlePriceChange(index, 'quantity', e.target.value)}
                  type="text"
                />
              </Col>
              <Col span={3}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>Unit</div>
                <Select
                  placeholder="Unit"
                  value={detail.unit}
                  onChange={(value) => handlePriceChange(index, 'unit', value)}
                  style={{ width: '100%' }}
                >
                  <Select.Option value="kg">Kg</Select.Option>
                  <Select.Option value="g">Gram</Select.Option>
                  <Select.Option value="pcs">Pieces</Select.Option>
                </Select>
              </Col>
              <Col span={3}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>GST</div>
                <Select
                  placeholder="GST"
                  value={detail.gst}
                  onChange={(value) => handlePriceChange(index, 'gst', value)}
                  style={{ width: '100%' }}
                >
                  <Select.Option value={0}>0%</Select.Option>
                  <Select.Option value={5}>5%</Select.Option>
                  <Select.Option value={12}>12%</Select.Option>
                  <Select.Option value={18}>18%</Select.Option>
                  <Select.Option value={22}>22%</Select.Option>
                </Select>
              </Col>
              {isCakeProduct && (
                <Col span={3}>
                  <div style={{ marginBottom: '4px', fontSize: '12px' }}>Cake Type</div>
                  <Select
                    placeholder="Cake Type"
                    value={detail.cakeType}
                    onChange={(value) => handlePriceChange(index, 'cakeType', value)}
                    style={{ width: '100%' }}
                  >
                    <Select.Option value="freshCream">FC</Select.Option>
                    <Select.Option value="butterCream">BC</Select.Option>
                  </Select>
                </Col>
              )}
              <Col span={isCakeProduct ? 1 : 4}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>Delete</div>
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    const updatedDetails = priceDetails.filter((_, i) => i !== index);
                    setPriceDetails(updatedDetails);
                  }}
                  style={{ width: '100%' }}
                />
              </Col>
            </Row>
          </Card>
        ))}

        <Form.Item>
          <Button type="primary" htmlType="submit">Submit</Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ProductForm;