/**
 * BLE Adapter - Main API interface
 */

import { EventEmitter } from 'events';
import {
  BLEState,
  BLEError,
  AdvertisingOptions,
  ScanOptions,
  DiscoveredDevice,
  BLEAdapterEvents,
} from './types';
import { parseManufacturerData } from './manufacturer';
import { parseMeshPacket } from './mesh';

/**
 * TypeScript interface for the native BLE adapter
 * This will be implemented by the native addon
 */
export interface IBLEAdapterNative extends EventEmitter {
  getState(): Promise<BLEState>;
  startAdvertising(options: AdvertisingOptions): Promise<void>;
  updateAdvertisingData(data: Buffer): Promise<void>;
  stopAdvertising(): Promise<void>;
  startScanning(options: ScanOptions): Promise<void>;
  stopScanning(): Promise<void>;
  destroy(): Promise<void>;
}

/**
 * BLE Adapter - High-level TypeScript API
 *
 * Provides a clean, typed interface for BLE advertising and scanning
 * without requiring GATT connections or pairing.
 *
 * @example
 * ```typescript
 * const ble = new BLEAdapter();
 *
 * ble.on('stateChange', (state) => {
 *   if (state === 'poweredOn') {
 *     ble.startAdvertising({
 *       name: 'MyDevice',
 *       manufacturerData: Buffer.from([0xFF, 0xFF, 0x01, 0x02])
 *     });
 *   }
 * });
 * ```
 */
export class BLEAdapter extends EventEmitter {
  private nativeAdapter: IBLEAdapterNative;
  private _isAdvertising = false;
  private _isScanning = false;
  private _currentState: BLEState = 'unknown';

  /**
   * Create a new BLE adapter instance
   * @param nativeAdapter Optional native adapter (for testing with mocks)
   */
  constructor(nativeAdapter?: IBLEAdapterNative) {
    super();

    if (nativeAdapter) {
      this.nativeAdapter = nativeAdapter;
    } else {
      // Load native addon (will be implemented later)
      try {
        const addon = require('../cpp/build/Release/ble_addon.node');
        this.nativeAdapter = new addon.BLEAdapter();
      } catch (err) {
        throw new BLEError(
          'OPERATION_FAILED',
          'Failed to load native BLE addon. Ensure the module is built correctly.',
          err
        );
      }
    }

    // Forward events from native adapter
    this.setupEventForwarding();
  }

  /**
   * Get current adapter state
   */
  async getState(): Promise<BLEState> {
    this._currentState = await this.nativeAdapter.getState();
    return this._currentState;
  }

  /**
   * Check if adapter is currently advertising
   */
  isAdvertising(): boolean {
    return this._isAdvertising;
  }

  /**
   * Check if adapter is currently scanning
   */
  isScanning(): boolean {
    return this._isScanning;
  }

  /**
   * Start BLE advertising
   * @param options Advertising configuration
   * @throws {BLEError} If adapter is not powered on or already advertising
   */
  async startAdvertising(options: AdvertisingOptions): Promise<void> {
    this.validateAdvertisingOptions(options);

    await this.nativeAdapter.startAdvertising(options);
    this._isAdvertising = true;
  }

  /**
   * Update advertising data without stopping/restarting
   * @param data New manufacturer data (company ID + payload)
   * @throws {BLEError} If not currently advertising
   */
  async updateAdvertisingData(data: Buffer): Promise<void> {
    if (!Buffer.isBuffer(data)) {
      throw new BLEError('INVALID_PARAMETER', 'Data must be a Buffer');
    }

    if (data.length < 2) {
      throw new BLEError('INVALID_PARAMETER', 'Manufacturer data must be at least 2 bytes');
    }

    await this.nativeAdapter.updateAdvertisingData(data);
  }

  /**
   * Stop advertising
   */
  async stopAdvertising(): Promise<void> {
    await this.nativeAdapter.stopAdvertising();
    this._isAdvertising = false;
  }

  /**
   * Start scanning for BLE devices
   * @param options Scan configuration
   * @throws {BLEError} If adapter is not powered on or already scanning
   */
  async startScanning(options: ScanOptions = {}): Promise<void> {
    this.validateScanOptions(options);

    await this.nativeAdapter.startScanning(options);
    this._isScanning = true;
  }

  /**
   * Stop scanning for devices
   */
  async stopScanning(): Promise<void> {
    await this.nativeAdapter.stopScanning();
    this._isScanning = false;
  }

  /**
   * Cleanup and release resources
   */
  async destroy(): Promise<void> {
    await this.nativeAdapter.destroy();
    this._isAdvertising = false;
    this._isScanning = false;
    this.removeAllListeners();
  }

  /**
   * Validate advertising options
   */
  private validateAdvertisingOptions(options: AdvertisingOptions): void {
    if (options.interval !== undefined) {
      if (typeof options.interval !== 'number' || options.interval < 20 || options.interval > 10000) {
        throw new BLEError(
          'INVALID_PARAMETER',
          'Advertising interval must be between 20ms and 10000ms'
        );
      }
    }

    if (options.manufacturerData !== undefined) {
      if (!Buffer.isBuffer(options.manufacturerData)) {
        throw new BLEError('INVALID_PARAMETER', 'Manufacturer data must be a Buffer');
      }

      if (options.manufacturerData.length < 2) {
        throw new BLEError(
          'INVALID_PARAMETER',
          'Manufacturer data must be at least 2 bytes (company ID)'
        );
      }

      if (options.manufacturerData.length > 27) {
        throw new BLEError(
          'INVALID_PARAMETER',
          'Manufacturer data must not exceed 27 bytes for legacy advertising'
        );
      }
    }

    if (options.serviceUUIDs !== undefined) {
      if (!Array.isArray(options.serviceUUIDs)) {
        throw new BLEError('INVALID_PARAMETER', 'Service UUIDs must be an array');
      }
    }
  }

  /**
   * Validate scan options
   */
  private validateScanOptions(options: ScanOptions): void {
    if (options.filterByManufacturer !== undefined) {
      if (typeof options.filterByManufacturer !== 'number' ||
          options.filterByManufacturer < 0 ||
          options.filterByManufacturer > 0xFFFF) {
        throw new BLEError(
          'INVALID_PARAMETER',
          'Manufacturer ID must be a number between 0 and 0xFFFF'
        );
      }
    }

    if (options.filterByService !== undefined) {
      if (!Array.isArray(options.filterByService)) {
        throw new BLEError('INVALID_PARAMETER', 'Service filter must be an array');
      }
    }

    if (options.duplicateTimeout !== undefined) {
      if (typeof options.duplicateTimeout !== 'number' || options.duplicateTimeout < 0) {
        throw new BLEError(
          'INVALID_PARAMETER',
          'Duplicate timeout must be a positive number'
        );
      }
    }
  }

  /**
   * Setup event forwarding from native adapter to this instance
   */
  private setupEventForwarding(): void {
    this.nativeAdapter.on('stateChange', (state: BLEState) => {
      this._currentState = state;
      this.emit('stateChange', state);
    });

    this.nativeAdapter.on('advertisingStarted', (options: AdvertisingOptions) => {
      this._isAdvertising = true;
      this.emit('advertisingStarted', options);
    });

    this.nativeAdapter.on('advertisingStopped', () => {
      this._isAdvertising = false;
      this.emit('advertisingStopped');
    });

    this.nativeAdapter.on('advertisingDataUpdated', (data: Buffer) => {
      this.emit('advertisingDataUpdated', data);
    });

    this.nativeAdapter.on('scanningStarted', (options: ScanOptions) => {
      this._isScanning = true;
      this.emit('scanningStarted', options);
    });

    this.nativeAdapter.on('scanningStopped', () => {
      this._isScanning = false;
      this.emit('scanningStopped');
    });

    this.nativeAdapter.on('deviceDiscovered', (device: DiscoveredDevice) => {
      // Parse manufacturer data at higher level and attach productInfo
      try {
        const parsed = parseManufacturerData(device.manufacturerData as Buffer);
        (device as any).manufacturer = parsed;

        // Parse mesh packet if present
        try {
          const mesh = parseMeshPacket(device.manufacturerData as Buffer);
          if (mesh) (device as any).meshPacket = mesh;
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore parse errors
      }

      this.emit('deviceDiscovered', device);
    });

    this.nativeAdapter.on('error', (error: BLEError) => {
      this.emit('error', error);
    });
  }

  // TypeScript type support for event emitter
  on<K extends keyof BLEAdapterEvents>(
    event: K,
    listener: BLEAdapterEvents[K]
  ): this {
    return super.on(event, listener);
  }

  once<K extends keyof BLEAdapterEvents>(
    event: K,
    listener: BLEAdapterEvents[K]
  ): this {
    return super.once(event, listener);
  }

  emit<K extends keyof BLEAdapterEvents>(
    event: K,
    ...args: Parameters<BLEAdapterEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  off<K extends keyof BLEAdapterEvents>(
    event: K,
    listener: BLEAdapterEvents[K]
  ): this {
    return super.off(event, listener);
  }
}
