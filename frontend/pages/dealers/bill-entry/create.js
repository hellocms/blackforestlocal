import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Row, Col, Select, Upload, DatePicker, Layout } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import moment from 'moment';
import { jwtDecode } from 'jwt-decode';
import BranchHeader from '../../../components/BranchHeader';

const { Option } = Select;
const { Dragger } = Upload;

const CreateBillEntry = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [filteredDealers, setFilteredDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [userName, setUserName] = useState('User');
  const [branchName, setBranchName] = useState('');
  const [branchId, setBranchId] = useState(null);
  const [errors, setErrors] = useState({ company: '', dealer: '', branch: '', billNumber: '', billDate: '', amount: '', billImage: '', product: '' });
  const router = useRouter();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  // Fetch Branch Details
  const fetchBranchDetails = async (token, branchId) => {
    try {
      console.log('Fetching branches for branchId:', branchId);
      const response = await fetch(`${BACKEND_URL}/api/branches`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Branches response:', JSON.stringify(data, null, 2));
        const branch = data.find(b => b._id === branchId);
        if (branch) {
          console.log('Found branch:', JSON.stringify(branch, null, 2));
          setBranchName(branch.name || 'Unknown Branch');
        } else {
          console.error('Branch not found for branchId:', branchId);
          message.error('Branch not found');
          setBranchName('Unknown Branch');
        }
      } else {
        console.error('Failed to fetch branches, status:', response.status, 'statusText:', response.statusText);
        message.error('Failed to fetch branches');
        setBranchName('Unknown Branch');
      }
    } catch (error) {
      console.error('Fetch branches error:', error.message);
      message.error('Error fetching branches');
      setBranchName('Unknown Branch');
    }
  };

  // Fetch Companies
  const fetchCompanies = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/companies`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        setCompanies(Array.isArray(data) ? data : []);
        console.log('Companies fetched:', JSON.stringify(data, null, 2));
      } else {
        message.error(data.message || 'Failed to fetch companies');
        setCompanies([]);
      }
    } catch (error) {
      console.error('❌ Error fetching companies:', error);
      message.error('Error fetching companies');
      setCompanies([]);
    }
  };

  // Fetch Dealers
  const fetchDealers = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/dealers`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        setDealers(Array.isArray(data) ? data : []);
        console.log('Dealers fetched:', JSON.stringify(data, null, 2));
      } else {
        message.error(data.message || 'Failed to fetch dealers');
        setDealers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching dealers:', error);
      message.error('Error fetching dealers');
      setDealers([]);
    }
  };

  // Fetch Products
  const fetchProducts = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        setProducts(Array.isArray(data) ? data : []);
        console.log('Products fetched:', JSON.stringify(data, null, 2));
      } else {
        message.error(data.message || 'Failed to fetch products');
        setProducts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      message.error('Error fetching products');
      setProducts([]);
    }
  };

  // Handle Company Selection
  const handleCompanyChange = (value) => {
    setSelectedCompany(value);
    setSelectedDealer(null);
    setFilteredDealers([]);
    setFilteredProducts([]);
    form.setFieldsValue({ dealer: undefined, product: undefined });

    if (value) {
      const relatedDealersByCompany = dealers.filter(dealer => 
        String(dealer.companyId || dealer.company_id || (dealer.company && dealer.company._id) || '') === String(value)
      );

      if (relatedDealersByCompany.length > 0) {
        setFilteredDealers(relatedDealersByCompany);
        console.log('Filtered dealers (direct company link):', JSON.stringify(relatedDealersByCompany, null, 2));
      } else {
        const companyProducts = products.filter(product => product.company?._id === value);
        const dealerIds = new Set();
        const relatedDealers = [];

        companyProducts.forEach(product => {
          if (product.dealers && Array.isArray(product.dealers)) {
            product.dealers.forEach(dealer => {
              if (dealer._id && !dealerIds.has(dealer._id)) {
                dealerIds.add(dealer._id);
                relatedDealers.push(dealer);
              }
            });
          }
        });

        setFilteredDealers(relatedDealers);
        console.log('Filtered dealers (from products):', JSON.stringify(relatedDealers, null, 2));
        if (relatedDealers.length === 0) {
          message.warning('No dealers found for the selected company. Check dealer assignments in products or database.');
        }
      }
    }
  };

  // Handle Dealer Selection
  const handleDealerChange = (value) => {
    setSelectedDealer(value);
    setFilteredProducts([]);
    form.setFieldsValue({ product: undefined });

    if (value && selectedCompany) {
      const relatedProducts = products.filter(product => 
        String(product.company?._id || '') === String(selectedCompany) &&
        product.dealers?.some(dealer => String(dealer._id) === String(value))
      );
      setFilteredProducts(relatedProducts);
      console.log('Filtered products:', JSON.stringify(relatedProducts, null, 2));
      if (relatedProducts.length === 0) {
        message.warning('No products found for the selected company and dealer.');
      }
    }
  };

  // Form Submission
  const onFinish = async (values) => {
    setLoading(true);
    setErrors({ company: '', dealer: '', branch: '', billNumber: '', billDate: '', amount: '', billImage: '', product: '' });

    console.log('Form Values:', values);

    const formData = new FormData();
    formData.append('company', values.company || '');
    formData.append('dealer', values.dealer || '');
    formData.append('branch', values.branch || '');
    formData.append('billNumber', values.billNumber || '');
    formData.append('billDate', values.billDate ? values.billDate.format('YYYY-MM-DD') : '');
    formData.append('amount', values.amount || '0');
    formData.append('product', values.product || '');

    if (values.billImage && Array.isArray(values.billImage) && values.billImage.length > 0) {
      const file = values.billImage[0].originFileObj;
      if (file instanceof File) {
        formData.append('billImage', file);
        console.log('Appended File:', file);
      } else {
        console.error('Invalid file object:', values.billImage[0]);
        setErrors((prev) => ({ ...prev, billImage: 'Invalid file format' }));
        setLoading(false);
        return;
      }
    } else {
      console.error('No file selected or invalid file list:', values.billImage);
      setErrors((prev) => ({ ...prev, billImage: 'No file selected or invalid file' }));
      setLoading(false);
      return;
    }

    for (let pair of formData.entries()) {
      console.log('FormData Entry:', pair[0], pair[1]);
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/dealers/bills`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      const result = await response.json();
      console.log('Backend Response:', result);
      console.log('Response OK:', response.ok, 'Status:', response.status);

      if (response.ok) {
        message.success(result.message || 'Bill entry created successfully');
        // Reset form and states for new bill entry
        form.resetFields();
        setSelectedCompany(null);
        setSelectedDealer(null);
        setFilteredDealers([]);
        setFilteredProducts([]);
      } else {
        console.error('Submission failed:', result.message);
        if (result.message.includes('required')) {
          if (result.message.includes('company')) setErrors((prev) => ({ ...prev, company: 'Company is required' }));
          if (result.message.includes('dealer')) setErrors((prev) => ({ ...prev, dealer: 'Dealer is required' }));
          if (result.message.includes('branch')) setErrors((prev) => ({ ...prev, branch: 'Branch is required' }));
          if (result.message.includes('bill number')) setErrors((prev) => ({ ...prev, billNumber: 'Bill number is required' }));
          if (result.message.includes('bill date')) setErrors((prev) => ({ ...prev, billDate: 'Bill date is required' }));
          if (result.message.includes('amount')) setErrors((prev) => ({ ...prev, amount: 'Amount is required' }));
          if (result.message.includes('bill image')) setErrors((prev) => ({ ...prev, billImage: 'Bill image is required' }));
          if (result.message.includes('product')) setErrors((prev) => ({ ...prev, product: 'Product is required' }));
        } else if (result.message.includes('positive')) {
          setErrors((prev) => ({ ...prev, amount: 'Amount must be a positive number' }));
        } else if (result.message.includes('unique')) {
          setErrors((prev) => ({ ...prev, billNumber: 'Bill number must be unique' }));
        } else if (result.message.includes('allowed')) {
          setErrors((prev) => ({ ...prev, billImage: 'Only images (jpeg, jpg, png) and PDF files are allowed!' }));
        } else if (result.message.includes('bill date')) {
          setErrors((prev) => ({ ...prev, billDate: result.message }));
        } else {
          message.error(result.message || 'An error occurred');
        }
      }
    } catch (err) {
      console.error('Submission error:', err);
      message.error('Server error while creating bill entry');
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Form Validation Errors:', errorInfo);
    const newErrors = { company: '', dealer: '', branch: '', billNumber: '', billDate: '', amount: '', billImage: '', product: '' };
    errorInfo.errorFields.forEach((field) => {
      if (field.name[0] === 'company') newErrors.company = field.errors[0];
      if (field.name[0] === 'dealer') newErrors.dealer = field.errors[0];
      if (field.name[0] === 'branch') newErrors.branch = field.errors[0];
      if (field.name[0] === 'billNumber') newErrors.billNumber = field.errors[0];
      if (field.name[0] === 'billDate') newErrors.billDate = field.errors[0];
      if (field.name[0] === 'amount') newErrors.amount = field.errors[0];
      if (field.name[0] === 'billImage') newErrors.billImage = field.errors[0];
      if (field.name[0] === 'product') newErrors.product = field.errors[0];
    });
    setErrors(newErrors);
    message.error('Please fill in all required fields correctly');
  };

  const uploadProps = {
    name: 'billImage',
    multiple: false,
    beforeUpload: (file) => {
      return false;
    },
    onChange(info) {
      if (info.file.status === 'error') {
        setErrors((prev) => ({ ...prev, billImage: 'Upload failed' }));
      }
      console.log('Upload onChange:', info.fileList);
    },
  };

  // Initial data fetch
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.info('Please log in to access the form');
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log('Decoded JWT:', decoded);
      setUserName(decoded.name || decoded.username || 'User');
      if (decoded.branchId) {
        setBranchId(decoded.branchId);
        console.log('Setting branchId:', decoded.branchId);
        fetchBranchDetails(token, decoded.branchId);
      } else {
        console.error('No branchId in JWT');
        message.error('No branch associated with this user');
        router.push('/login');
      }
      fetchCompanies(token);
      fetchDealers(token);
      fetchProducts(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      message.error('Invalid token, please log in again');
      router.push('/login');
    }
  }, [router, form]);

  // Set form branch value
  useEffect(() => {
    if (branchId) {
      console.log('Setting form branch value:', branchId);
      form.setFieldsValue({ branch: branchId });
    }
  }, [branchId, form]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <BranchHeader />
      <div
        style={{
          padding: '40px 20px',
          background: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)',
          marginTop: '64px',
        }}
      >
        <Row justify="center" align="middle">
          <Col xs={24} sm={20} md={16} lg={12}>
            <h1 style={{ color: '#000000', textAlign: 'center', marginBottom: '20px' }}>
              Create Bill Entry
            </h1>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
              <Form.Item
                validateStatus={errors.company ? 'error' : ''}
                help={errors.company || ''}
                label={<span style={{ color: '#000000' }}>Company Name</span>}
                name="company"
                rules={[{ required: true, message: 'Please select a company' }]}
              >
                <Select
                  placeholder="Select a company"
                  onChange={handleCompanyChange}
                  style={{ width: '100%', color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
                >
                  {companies.map((company) => (
                    <Option key={company._id} value={company._id}>
                      {company.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                validateStatus={errors.dealer ? 'error' : ''}
                help={errors.dealer || ''}
                label={<span style={{ color: '#000000' }}>Dealer Name</span>}
                name="dealer"
                rules={[{ required: true, message: 'Please select a dealer' }]}
              >
                <Select
                  placeholder={filteredDealers.length === 0 && selectedCompany ? 'No dealers available' : 'Select a dealer'}
                  onChange={handleDealerChange}
                  style={{ width: '100%', color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
                  disabled={!selectedCompany}
                >
                  {filteredDealers.map((dealer) => (
                    <Option key={dealer._id} value={dealer._id}>
                      {dealer.dealer_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                validateStatus={errors.product ? 'error' : ''}
                help={errors.product || ''}
                label={<span style={{ color: '#000000' }}>Product</span>}
                name="product"
                rules={[{ required: true, message: 'Please select a product' }]}
              >
                <Select
                  placeholder={filteredProducts.length === 0 && selectedDealer ? 'No products available' : 'Select a product'}
                  style={{ width: '100%', color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
                  disabled={!selectedCompany || !selectedDealer}
                >
                  {filteredProducts.map((product) => (
                    <Option key={product._id} value={product._id}>
                      {product.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label={<span style={{ color: '#000000' }}>Branch (Fixed)</span>}
                validateStatus={errors.branch ? 'error' : ''}
                help={errors.branch || ''}
              >
                <Input
                  value={branchName || 'Loading...'}
                  readOnly
                  style={{ width: '100%', color: '#000000', background: '#f5f5f5', borderColor: '#d3d3d3' }}
                />
              </Form.Item>

              <Form.Item
                name="branch"
                rules={[{ required: true, message: 'Branch is required' }]}
                hidden
              >
                <Input hidden />
              </Form.Item>

              <Form.Item
                validateStatus={errors.billNumber ? 'error' : ''}
                help={errors.billNumber || ''}
                label={<span style={{ color: '#000000' }}>Bill Number</span>}
                name="billNumber"
                rules={[{ required: true, message: 'Please enter the bill number' }]}
              >
                <Input
                  placeholder="Enter bill number"
                  style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
                />
              </Form.Item>

              <Form.Item
                validateStatus={errors.billDate ? 'error' : ''}
                help={errors.billDate || ''}
                label={<span style={{ color: '#000000' }}>Bill Date</span>}
                name="billDate"
                rules={[{ required: true, message: 'Please select the bill date' }]}
              >
                <DatePicker
                  placeholder="Select bill date"
                  style={{ width: '100%', color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
                  disabledDate={(current) => current && current > moment().endOf('day')}
                />
              </Form.Item>

              <Form.Item
                validateStatus={errors.amount ? 'error' : ''}
                help={errors.amount || ''}
                label={<span style={{ color: '#000000' }}>Amount of Bill (₹)</span>}
                name="amount"
                rules={[{ required: true, message: 'Please enter the amount' }]}
              >
                <Input
                  type="number"
                  placeholder="Enter amount"
                  min={0}
                  step="0.01"
                  style={{ color: '#000000', background: '#ffffff', borderColor: '#d3d3d3' }}
                />
              </Form.Item>

              <Form.Item
                validateStatus={errors.billImage ? 'error' : ''}
                help={errors.billImage || ''}
                label={<span style={{ color: '#000000' }}>Bill Image</span>}
                name="billImage"
                valuePropName="fileList"
                getValueFromEvent={(e) => (e && e.fileList ? e.fileList : [])}
                rules={[{ required: true, message: 'Please upload a bill image' }]}
              >
                <Dragger {...uploadProps} style={{ background: '#ffffff', borderColor: '#d3d3d3' }}>
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag file to this area to upload</p>
                  <p className="ant-upload-hint">
                    Support JPEG, JPG, PNG, and PDF files (max 5MB)
                  </p>
                </Dragger>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={{
                    background: 'linear-gradient(to right, #34495e, #1a3042)',
                    borderColor: '#34495e',
                    width: '100%',
                    color: '#ffffff',
                  }}
                >
                  Create Bill Entry
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </div>
    </Layout>
  );
};

CreateBillEntry.useLayout = false;
export default CreateBillEntry;