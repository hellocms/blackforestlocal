import { PRINTER_CONFIG } from './printerConfig';

export const generateReceipt = (orderData) => {
  const encoder = new TextEncoder();
  const buffer = [
    // Initialize printer with custom settings
    new Uint8Array([
      ...PRINTER_CONFIG.commands.init,
      ...PRINTER_CONFIG.commands.density,
      ...PRINTER_CONFIG.commands.codepage
    ]),
    
    // Header
    encoder.encode(`${orderData.branch.name}\n`),
    encoder.encode(`${orderData.branch.address}\n`),
    encoder.encode(`Bill No: ${orderData.billNo}\n\n`),
    
    // Items
    ...orderData.items.map(item => 
      encoder.encode(`${item.name} x${item.qty} ₹${item.total}\n`)
    ),
    
    // Footer
    encoder.encode('\n--------------------------------\n'),
    encoder.encode(`Total: ₹${orderData.grandTotal}\n`),
    
    // Printer commands
    new Uint8Array(PRINTER_CONFIG.commands.cut),
    new Uint8Array(PRINTER_CONFIG.commands.beep)
  ];

  return buffer;
};