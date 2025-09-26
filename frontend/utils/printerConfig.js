export const PRINTER_CONFIG = {
    // Bluetooth Configuration
    bluetooth: {
      serviceUUID: '00001101-0000-1000-8000-00805f9b34fb', // SPP Service UUID
      characteristicUUID: '00001102-0000-1000-8000-00805f9b34fb',
      deviceName: 'CN811-UWB-AC5D',
      macAddress: '24:0B:BC:B1:AC:5D' // Optional for direct connection
    },
  
    // ESC/POS Commands Configuration
    commands: {
      init: [0x1B, 0x40],         // Initialize printer
      cut: [0x1D, 0x56, 0x42, 0x00], // Full cut
      beep: [0x1B, 0x42, 0x03, 0x02], // 3 beeps, 200ms each
      drawerKick: [0x1B, 0x70, 0x00, 0x32, 0xFF], // Open cash drawer
      density: [0x1D, 0x28, 0x4B, 0x02, 0x00, 0x37], // Set density to 7
      codepage: [0x1B, 0x74, 0x00] // CP437
    },
  
    // Printer Hardware Specs
    specs: {
      maxWidth: 576,    // 80mm (576 dots)
      printSpeed: 300,  // mm/s
      supportedInterfaces: ['bluetooth', 'usb', 'wifi']
    }
  };