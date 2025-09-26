import { PRINTER_CONFIG } from './printerConfig';

export const connectPrinter = async () => {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{
        name: PRINTER_CONFIG.bluetooth.deviceName,
        services: [PRINTER_CONFIG.bluetooth.serviceUUID]
      }]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(PRINTER_CONFIG.bluetooth.serviceUUID);
    const characteristic = await service.getCharacteristic(PRINTER_CONFIG.bluetooth.characteristicUUID);
    
    return {
      device,
      characteristic,
      disconnect: () => server.disconnect()
    };
  } catch (error) {
    throw new Error(`Bluetooth connection failed: ${error.message}`);
  }
};

export const sendToPrinter = async (characteristic, data) => {
  try {
    await characteristic.writeValue(data);
    return true;
  } catch (error) {
    throw new Error(`Print failed: ${error.message}`);
  }
};