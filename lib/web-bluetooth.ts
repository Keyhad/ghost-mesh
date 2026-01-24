/**
 * Web Bluetooth API Implementation
 * Works on Windows/Chrome/Edge for BLE advertising mesh
 */

import { Message } from './types';

const GHOST_MESH_SERVICE_UUID = '00001234-0000-1000-8000-00805f9b34fb';

export class WebBluetoothMesh {
  private myPhone: string;
  private onDeviceFound?: (deviceId: string, rssi: number) => void;
  private onMessageReceived?: (message: Message) => void;
  private scanning: boolean = false;

  constructor(phoneNumber: string) {
    this.myPhone = phoneNumber;
  }

  /**
   * Check if Web Bluetooth is available
   */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Start scanning for BLE advertisements
   */
  async startScanning(): Promise<void> {
    if (!WebBluetoothMesh.isSupported()) {
      throw new Error('Web Bluetooth not supported in this browser');
    }

    try {
      console.log('🌐 Starting Web Bluetooth scanning...');

      // Request device with advertisement watching
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [GHOST_MESH_SERVICE_UUID]
      });

      console.log('✅ Bluetooth permission granted');

      // Start watching advertisements (experimental API)
      if ('watchAdvertisements' in device) {
        device.addEventListener('advertisementreceived', (event: any) => {
          this.handleAdvertisement(event);
        });

        await (device as any).watchAdvertisements();
        this.scanning = true;
        console.log('📡 Web Bluetooth scanning active');
      } else {
        console.warn('⚠️ Advertisement watching not supported, using requestLEScan fallback');
        await this.fallbackScan();
      }
    } catch (error) {
      console.error('Failed to start Web Bluetooth scanning:', error);
      throw error;
    }
  }

  /**
   * Fallback scanning using requestLEScan (Chrome 90+)
   */
  private async fallbackScan(): Promise<void> {
    if ('bluetooth' in navigator && 'requestLEScan' in (navigator.bluetooth as any)) {
      try {
        const scan = await (navigator.bluetooth as any).requestLEScan({
          filters: [{ services: [GHOST_MESH_SERVICE_UUID] }],
          keepRepeatedDevices: true
        });

        scan.addEventListener('advertisementreceived', (event: any) => {
          this.handleAdvertisement(event);
        });

        this.scanning = true;
        console.log('📡 Web Bluetooth LEScan active');
      } catch (error) {
        console.error('LEScan failed:', error);
        throw error;
      }
    } else {
      throw new Error('No Web Bluetooth scanning method available');
    }
  }

  /**
   * Handle received advertisement
   */
  private handleAdvertisement(event: any): void {
    const device = event.device;
    const rssi = event.rssi;
    const manufacturerData = event.manufacturerData;

    console.log('📡 BLE Advertisement:', {
      name: device.name,
      id: device.id,
      rssi: rssi
    });

    // Notify device discovered
    this.onDeviceFound?.(device.id, rssi);

    // Parse manufacturer data for messages
    if (manufacturerData) {
      for (let [key, value] of manufacturerData) {
        try {
          const message = this.parseMessageData(value);
          if (message) {
            this.onMessageReceived?.(message);
          }
        } catch (error) {
          console.debug('Could not parse message from manufacturer data');
        }
      }
    }
  }

  /**
   * Start BLE advertising (experimental)
   */
  async startAdvertising(message: Message): Promise<void> {
    // Check for Bluetooth Advertising API (very experimental, Chrome flag required)
    if ('bluetooth' in navigator && 'startAdvertising' in (navigator.bluetooth as any)) {
      try {
        const messageData = this.serializeMessage(message);

        await (navigator.bluetooth as any).startAdvertising({
          advertisingData: {
            serviceUUIDs: [GHOST_MESH_SERVICE_UUID],
            manufacturerData: [{
              companyIdentifier: 0xFFFF, // Custom
              data: messageData
            }]
          }
        });

        console.log('📡 Web Bluetooth advertising started');
      } catch (error) {
        console.warn('⚠️ Web Bluetooth advertising not available:', error);
        console.info('💡 Enable chrome://flags/#enable-experimental-web-platform-features');
      }
    } else {
      console.warn('⚠️ Bluetooth Advertising API not available');
      console.info('💡 Requires Chrome with experimental features enabled');
    }
  }

  /**
   * Serialize message to bytes
   */
  private serializeMessage(message: Message): Uint8Array {
    // Simple serialization - match your protocol
    const encoder = new TextEncoder();
    const json = JSON.stringify(message);
    return encoder.encode(json);
  }

  /**
   * Parse message from advertisement data
   */
  private parseMessageData(data: DataView): Message | null {
    try {
      const decoder = new TextDecoder();
      const bytes = new Uint8Array(data.buffer);
      const json = decoder.decode(bytes);
      return JSON.parse(json) as Message;
    } catch {
      return null;
    }
  }

  /**
   * Set callback for device discovered
   */
  onDevice(callback: (deviceId: string, rssi: number) => void): void {
    this.onDeviceFound = callback;
  }

  /**
   * Set callback for message received
   */
  onMessage(callback: (message: Message) => void): void {
    this.onMessageReceived = callback;
  }

  /**
   * Stop scanning
   */
  async stop(): Promise<void> {
    this.scanning = false;
    console.log('🛑 Web Bluetooth stopped');
  }

  /**
   * Check if currently scanning
   */
  isScanning(): boolean {
    return this.scanning;
  }
}
