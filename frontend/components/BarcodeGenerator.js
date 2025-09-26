import React, { useEffect, useRef, useState } from 'react';

const BarcodeGenerator = ({ upc }) => {
  const canvasRef = useRef(null);
  const [barcodeImage, setBarcodeImage] = useState(null);

  useEffect(() => {
    const generateBarcode = async () => {
      const bwipjs = (await import('bwip-js')).default;

      if (upc && canvasRef.current) {
        try {
          bwipjs.toCanvas(canvasRef.current, {
            bcid: 'ean13',
            text: upc,
            scale: 3,
            height: 30,
            includetext: true,
            textxalign: 'center',
          });

          // ✅ Convert canvas to image for printing
          const imageData = canvasRef.current.toDataURL('image/png');
          setBarcodeImage(imageData);
        } catch (err) {
          console.error('❌ Error generating barcode:', err);
        }
      }
    };

    generateBarcode();
  }, [upc]);

  return barcodeImage ? (
    <img src={barcodeImage} alt="Barcode" style={{ width: '150px', height: '50px' }} />
  ) : (
    <canvas ref={canvasRef} style={{ display: 'none' }} />
  );
};

export default BarcodeGenerator;
