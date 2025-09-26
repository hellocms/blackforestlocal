import { useEffect, useRef } from 'react';
import { Button, Input, Radio, message } from 'antd';
import { SaveOutlined, CloseOutlined, PrinterOutlined, WalletOutlined, CreditCardOutlined } from '@ant-design/icons';

const CartSider = ({
  isCartExpanded,
  selectedProducts,
  handleRemoveProduct,
  handleQuantityChange,
  waiterInput,
  handleWaiterInputChange,
  waiterName,
  waiterError,
  selectedWaiter,
  paymentMethod,
  setPaymentMethod,
  handleSave,
  handleSaveAndPrint,
  handleClearCart,
  lastBillNo,
  calculateCartTotals,
  formatDisplayName,
  formatPriceDetails,
}) => {
  const { totalQty, uniqueItems, subtotal, totalGST, totalWithGST } = calculateCartTotals();
  const productListRef = useRef(null);

  // Auto-scroll to the bottom of the product list when a new product is added
  useEffect(() => {
    if (productListRef.current) {
      productListRef.current.scrollTop = productListRef.current.scrollHeight;
    }
  }, [selectedProducts]);

  return (
    <div
      style={{
        background: '#FFFFFF',
        boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.1)',
        display: isCartExpanded ? 'block' : 'none',
        height: '100%',
        width: '400px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: '0 0 auto',
          padding: '20px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #000000',
          position: 'sticky',
          top: 0,
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#000000' }}>Cart</h3>
          {lastBillNo && (
            <p style={{ margin: 0, fontWeight: 'bold', color: '#000000' }}>
              Last Bill No: {lastBillNo}
            </p>
          )}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#000000' }}>Enter Waiter ID:</label>
          <Input
            value={waiterInput}
            onChange={(e) => handleWaiterInputChange(e.target.value)}
            placeholder="Enter waiter ID (e.g., 4 for E004)"
            style={{ width: '100%' }}
          />
          {waiterName && (
            <p style={{ marginTop: '5px', color: '#52c41a' }}>
              Waiter: {waiterName}
            </p>
          )}
          {waiterError && (
            <p style={{ marginTop: '5px', color: '#ff4d4f' }}>
              {waiterError}
            </p>
          )}
        </div>
      </div>
      <div
        ref={productListRef}
        style={{
          flex: '1 1 auto',
          overflowY: 'auto',
          padding: '20px',
          backgroundColor: '#FFFFFF',
        }}
      >
        {selectedProducts.length > 0 ? (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {selectedProducts.map((product) => {
              const gstRate = product.priceDetails?.[product.selectedUnitIndex]?.gst || 'non-gst';
              const unit = product.priceDetails?.[product.selectedUnitIndex]?.unit || '';
              const isKg = unit.toLowerCase().includes('kg');
              return (
                <li
                  key={`${product._id}-${product.selectedUnitIndex}`}
                  style={{ marginBottom: '30px', fontSize: '14px', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontWeight: 'bold', color: '#000000' }}>
                      {formatDisplayName(product)}{gstRate === 'non-gst' ? ' (Non-GST)' : ''}
                    </span>
                    <span style={{ flex: 1, textAlign: 'right', color: '#000000' }}>
                      {formatPriceDetails(product.priceDetails, product.selectedUnitIndex)}
                    </span>
                    <Button
                      type="text"
                      icon={<CloseOutlined />}
                      onClick={() => handleRemoveProduct(product._id, product.selectedUnitIndex)}
                      style={{
                        width: '24px',
                        height: '24px',
                        minWidth: '24px',
                        padding: 0,
                        fontSize: '14px',
                        color: '#ff4d4f',
                        backgroundColor: '#fff',
                        border: '2px solid #ff4d4f',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: '10px',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '10px',
                      paddingBottom: '5px',
                      borderBottom: '1px dotted #d9d9d9',
                    }}
                  >
                    <Input
                      type="number"
                      value={product.count}
                      onChange={(e) => handleQuantityChange(product._id, product.selectedUnitIndex, e.target.value, unit)}
                      style={{ width: '80px' }}
                      min="0"
                      step={isKg ? '0.1' : '1'}
                      onKeyPress={(e) => {
                        if (!isKg && e.key === '.') {
                          e.preventDefault();
                        }
                      }}
                      className="no-arrows"
                    />
                    <span style={{ fontWeight: 'bold', color: '#000000' }}>
                      ₹{(product.priceDetails?.[product.selectedUnitIndex]?.price * product.count || 0).toFixed(2)}
                      {gstRate !== 'non-gst' &&
                        ` + ₹${((product.priceDetails?.[product.selectedUnitIndex]?.price * product.count * (gstRate / 100)) || 0).toFixed(2)} GST`}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p style={{ color: '#000000' }}>No products selected.</p>
        )}
      </div>
      {selectedProducts.length > 0 && (
        <div
          style={{
            flex: '0 0 auto',
            backgroundColor: '#FFFFFF',
            padding: '10px',
            borderTop: '1px solid #000000',
            position: 'sticky',
            bottom: 0,
            zIndex: 1,
          }}
        >
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, marginBottom: 5 }}>
              <span style={{ flex: 1, color: '#000000' }}>Total (Excl. GST):</span>
              <span style={{ textAlign: 'right', color: '#000000' }}>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: 2 }}>
              <span style={{ flex: 1, color: '#000000' }}>GST:</span>
              <span style={{ textAlign: 'right', color: '#000000' }}>₹{totalGST.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: 'bold' }}>
              <span style={{ flex: 1, fontWeight: 'bold', color: '#000000' }}>Total:</span>
              <span style={{ textAlign: 'right', color: '#000000' }}>₹{totalWithGST.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: 2 }}>
              <span style={{ flex: 1, color: '#000000' }}>Total Items:</span>
              <span style={{ marginTop: '5px', color: '#000000' }}>{uniqueItems}</span>
            </div>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <Radio.Group
              onChange={(e) => setPaymentMethod(e.target.value)}
              value={paymentMethod}
              style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}
            >
              <Radio.Button value="cash" style={{ borderRadius: '50px', textAlign: 'center' }}>
                <WalletOutlined />
                <span> Cash</span>
              </Radio.Button>
              <Radio.Button value="CreditCard" style={{ borderRadius: '50px', textAlign: 'center' }}>
                <CreditCardOutlined />
                <span>CreditCard</span>
              </Radio.Button>
              <Radio.Button value="upi" style={{ borderRadius: '50px', textAlign: 'center' }}>
                <CreditCardOutlined />
                <span> UPI</span>
              </Radio.Button>
            </Radio.Group>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', gap: '10px' }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              style={{ flex: 1 }}
              disabled={lastBillNo && selectedProducts.length === 0}
            >
              Save
            </Button>
            <Button
              type="default"
              icon={<CloseOutlined />}
              onClick={handleClearCart}
              style={{ flex: 1, backgroundColor: '#ff4d4f', color: '#fff' }}
              disabled={selectedProducts.length === 0}
            >
              Clear
            </Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handleSaveAndPrint}
              style={{ flex: 1 }}
              disabled={lastBillNo && selectedProducts.length === 0}
            >
              Save & Print
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartSider;