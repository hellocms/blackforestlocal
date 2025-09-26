import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Space, message, Input } from 'antd';
import { PrinterOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import bwipjs from 'bwip-js'; // ✅ Barcode Generator for Print View

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

const BarcodePrint = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [printCounts, setPrintCounts] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`);
      const data = await response.json();
      setProducts(data);

      // ✅ Initialize print count for each product
      const initialPrintCounts = {};
      data.forEach((product) => {
        initialPrintCounts[product._id] = 1;
      });
      setPrintCounts(initialPrintCounts);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      message.error('Failed to load products');
    }
  };

  // ✅ Generate Barcode Image for Print View
  const generateBarcode = (upc) => {
    if (!upc) return '';
    try {
      const canvas = document.createElement('canvas');
      bwipjs.toCanvas(canvas, {
        bcid: 'ean13',
        text: upc,
        scale: 3,
        height: 20,
        includetext: false, // ✅ Removes repeated barcode number
        textxalign: 'center',
      });
      return canvas.toDataURL();
    } catch (err) {
      console.error('❌ Barcode generation error:', err);
      return '';
    }
  };

  // ✅ Handle Print Functionality
  const handlePrint = () => {
    if (selectedProducts.length === 0) {
      message.warning('Select at least one product to print');
      return;
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write('<html><head><title>Print Barcodes</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      @media print {
        body { padding: 10px; }
        .barcode-container { 
          display: grid; 
          grid-template-columns: repeat(3, 35mm);
          gap: 5mm;
          justify-content: flex-start;
        }
        .barcode-item { 
          width: 35mm; 
          height: 22mm; 
          padding: 2mm; 
          border: 1px solid #000;
          text-align: center; 
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
        }
        .barcode-item img { 
          max-width: 32mm;
          max-height: 12mm;
          object-fit: contain;
        }
        .barcode-item h4 { font-size: 9px; margin-bottom: 1mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .barcode-item p { font-size: 9px; margin: 1mm 0; font-weight: bold; }
      }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(printRef.current.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  // ✅ Handle Print Count Change
  const handlePrintCountChange = (productId, value) => {
    if (value < 1) value = 1; // ✅ Prevent Zero or Negative Numbers
    setPrintCounts({ ...printCounts, [productId]: value });
  };

  const columns = [
    {
      title: 'Select',
      dataIndex: 'select',
      render: (_, record) => (
        <input
          type="checkbox"
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedProducts([...selectedProducts, record]);
            } else {
              setSelectedProducts(selectedProducts.filter((p) => p._id !== record._id));
            }
          }}
        />
      ),
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Product ID',
      dataIndex: 'productId',
      key: 'productId',
    },
    {
      title: 'EAN-13 Barcode',
      dataIndex: 'upc',
      key: 'upc',
      render: (upc) => <span>{upc}</span>,
    },
    {
      title: 'PQU',
      dataIndex: 'priceDetails',
      key: 'priceDetails',
      render: (priceDetails) => {
        if (priceDetails && priceDetails.length > 0) {
          const { price, unit, quantity } = priceDetails[0];
          return <span>{`${price} / ${quantity} ${unit}`}</span>;
        }
        return 'N/A';
      },
    },
    {
      title: 'Print Count',
      dataIndex: 'printCount',
      key: 'printCount',
      render: (_, record) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: 120,
            position: 'relative',
          }}
          onMouseEnter={() => setFocusedInput(record._id)}
          onMouseLeave={() => setFocusedInput(null)}
        >
          <Input
            type="text"
            value={printCounts[record._id] || 1}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // ✅ Allow Only Numbers
              handlePrintCountChange(record._id, parseInt(value, 10) || 1);
            }}
            style={{
              textAlign: 'center',
              width: '100%',
              paddingRight: 40,
              appearance: 'textfield', // ✅ Hides Default Up/Down Arrows
            }}
          />
          {focusedInput === record._id && (
            <>
              <Button
                icon={<MinusOutlined />}
                onClick={() => handlePrintCountChange(record._id, (printCounts[record._id] || 1) - 1)}
                style={{
                  position: 'absolute',
                  left: 0,
                  width: 30,
                  height: '100%',
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                }}
              />
              <Button
                icon={<PlusOutlined />}
                onClick={() => handlePrintCountChange(record._id, (printCounts[record._id] || 1) + 1)}
                style={{
                  position: 'absolute',
                  right: 0,
                  width: 30,
                  height: '100%',
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                }}
              />
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto', background: '#fff' }}>
      <h2>Print Barcodes</h2>
      <Table columns={columns} dataSource={products} rowKey="_id" pagination={{ pageSize: 10 }} />

      {/* ✅ Hidden Print Area */}
      <div ref={printRef} style={{ display: 'none' }}>
        <div className="barcode-container">
          {selectedProducts.flatMap((product) =>
            Array(printCounts[product._id] || 1).fill(null).map((_, i) => (
              <div key={`${product._id}-${i}`} className="barcode-item">
                <h4>{product.name}</h4>
                <img src={generateBarcode(product.upc)} alt="Barcode" />

                {/* ✅ FIX: Check if priceDetails exists before accessing */}
                {product.priceDetails && product.priceDetails.length > 0 ? (
                  <p>{`${product.priceDetails[0].price} / ${product.priceDetails[0].quantity} ${product.priceDetails[0].unit}`}</p>
                ) : (
                  <p>N/A</p> // ✅ Show "N/A" if no price details exist
                )}
              </div>
            ))
          )}
        </div>
      </div>


      <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint} style={{ marginTop: '10px' }}>
        Print Selected
      </Button>
    </div>
  );
};

export default BarcodePrint;
