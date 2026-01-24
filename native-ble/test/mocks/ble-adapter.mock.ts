/**
 * Mock BLE native addon for testing
 * Simulates the behavior of the native C++ addon without requiring actual BLE hardware
 */

import { EventEmitter } from 'events';

export type BLEState = 'unknown' | 'resetting' | 'unsupported' | 'unauthorized' | 'poweredOff' | 'poweredOn';

export interface AdvertisingOptions {
  name?: string;
  serviceUUIDs?: string[];
  manufacturerData?: Buffer;
  interval?: number;
  txPowerLevel?: number;
}

export interface ScanOptions {
  filterByManufacturer?: number;
  filterByService?: string[];
  allowDuplicates?: boolean;
  duplicateTimeout?: number;
}

export interface DiscoveredDevice {
  address: string;
  name?: string;
  rssi: number;
  manufacturerData?: Buffer;
  serviceUUIDs?: string[];
  timestamp: number;
}

export class MockBLEAdapterNative extends EventEmitter {
  private state: BLEState = 'poweredOn';
  private isAdvertising = false;
  private isScanning = false;
  private advertisingData: AdvertisingOptions | null = null;
  private scanOptions: ScanOptions | null = null;

  // Simulated devices for testing
  private mockDevices: DiscoveredDevice[] = [];

  // Test controls
  public simulatedDelay = 100; // ms
  public shouldFailNextOperation = false;
  public failureError = 'Simulated failure';

  constructor() {
    super();
  }

  /**
   * Test helper: Add a mock device to be discovered
   */
  addMockDevice(device: DiscoveredDevice): void {
    this.mockDevices.push(device);
  }

  /**
   * Test helper: Clear all mock devices
   */
  clearMockDevices(): void {
    this.mockDevices = [];
  }

  /**
   * Test helper: Simulate state change
   */
  simulateStateChange(newState: BLEState): void {
    this.state = newState;
    this.emit('stateChange', newState);
  }

  /**
   * Test helper: Simulate device discovery
   */
  simulateDeviceDiscovery(device: DiscoveredDevice): void {
    if (this.isScanning) {
      this.emit('deviceDiscovered', device);
    }
  }

  /**
   * Get current adapter state
   */
  async getState(): Promise<BLEState> {
    await this.delay();
    return this.state;
  }

  /**
   * Start advertising
   */
  async startAdvertising(options: AdvertisingOptions): Promise<void> {
    await this.delay();

    if (this.shouldFailNextOperation) {
      this.shouldFailNextOperation = false;
      throw new Error(this.failureError);
    }

    if (this.state !== 'poweredOn') {
      throw new Error(`Cannot advertise when state is ${this.state}`);
    }

    if (this.isAdvertising) {
      throw new Error('Already advertising');
    }

    // Validate options
    if (options.manufacturerData && options.manufacturerData.length < 2) {
      throw new Error('Manufacturer data must be at least 2 bytes (company ID)');
    }

    if (options.interval && (options.interval < 20 || options.interval > 10000)) {
      throw new Error('Advertising interval must be between 20ms and 10000ms');
    }

    this.advertisingData = options;
    this.isAdvertising = true;
    this.emit('advertisingStarted', options);
  }

  /**
   * Update advertising data
   */
  async updateAdvertisingData(data: Buffer): Promise<void> {
    await this.delay();

    if (this.shouldFailNextOperation) {
      this.shouldFailNextOperation = false;
      throw new Error(this.failureError);
    }

    if (!this.isAdvertising) {
      throw new Error('Not currently advertising');
    }

    if (data.length < 2) {
      throw new Error('Manufacturer data must be at least 2 bytes');
    }

    if (this.advertisingData) {
      this.advertisingData.manufacturerData = data;
    }

    this.emit('advertisingDataUpdated', data);
  }

  /**
   * Stop advertising
   */
  async stopAdvertising(): Promise<void> {
    await this.delay();

    if (!this.isAdvertising) {
      return; // Idempotent
    }

    this.isAdvertising = false;
    this.advertisingData = null;
    this.emit('advertisingStopped');
  }

  /**
   * Start scanning
   */
  async startScanning(options: ScanOptions): Promise<void> {
    await this.delay();

    if (this.shouldFailNextOperation) {
      this.shouldFailNextOperation = false;
      throw new Error(this.failureError);
    }

    if (this.state !== 'poweredOn') {
      throw new Error(`Cannot scan when state is ${this.state}`);
    }

    if (this.isScanning) {
      throw new Error('Already scanning');
    }

    this.scanOptions = options;
    this.isScanning = true;
    this.emit('scanningStarted', options);

    // Simulate discovering mock devices
    this.startDiscoveringDevices();
  }

  /**
   * Stop scanning
   */
  async stopScanning(): Promise<void> {
    await this.delay();

    if (!this.isScanning) {
      return; // Idempotent
    }

    this.isScanning = false;
    this.scanOptions = null;
    this.emit('scanningStopped');
  }

  /**
   * Check if advertising
   */
  isAdvertisingActive(): boolean {
    return this.isAdvertising;
  }

  /**
   * Check if scanning
   */
  isScanningActive(): boolean {
    return this.isScanning;
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    await this.stopAdvertising();
    await this.stopScanning();
    this.removeAllListeners();
  }

  // Private helpers

  private async delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.simulatedDelay));
  }

  private startDiscoveringDevices(): void {
    // Simulate discovering devices after a delay
    setTimeout(() => {
      if (!this.isScanning) return;

      for (const device of this.mockDevices) {
        // Apply filters
        if (this.shouldDeviceBeReported(device)) {
          this.emit('deviceDiscovered', device);
        }
      }
    }, this.simulatedDelay * 2);
  }

  private shouldDeviceBeReported(device: DiscoveredDevice): boolean {
    if (!this.scanOptions) return true;

    // Filter by manufacturer
    if (this.scanOptions.filterByManufacturer && device.manufacturerData) {
      const companyId = device.manufacturerData.readUInt16LE(0);
      if (companyId !== this.scanOptions.filterByManufacturer) {
        return false;
      }
    }

    // Filter by service
    if (this.scanOptions.filterByService && this.scanOptions.filterByService.length > 0) {
      if (!device.serviceUUIDs || device.serviceUUIDs.length === 0) {
        return false;
      }

      const hasMatchingService = this.scanOptions.filterByService.some(uuid =>
        device.serviceUUIDs!.includes(uuid)
      );

      if (!hasMatchingService) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Factory function to create mock adapter
 */
export function createMockBLEAdapter(): MockBLEAdapterNative {
  return new MockBLEAdapterNative();
}
