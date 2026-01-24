/**
 * Type definitions for GhostMesh Native BLE Module
 */

/**
 * BLE adapter state
 */
export type BLEState =
  | 'unknown'
  | 'resetting'
  | 'unsupported'
  | 'unauthorized'
  | 'poweredOff'
  | 'poweredOn';

/**
 * BLE error codes
 */
export type BLEErrorCode =
  | 'INVALID_STATE'
  | 'INVALID_PARAMETER'
  | 'ALREADY_ADVERTISING'
  | 'ALREADY_SCANNING'
  | 'NOT_ADVERTISING'
  | 'NOT_SCANNING'
  | 'OPERATION_FAILED'
  | 'TIMEOUT'
  | 'UNSUPPORTED';

/**
 * Options for starting BLE advertising
 */
export interface AdvertisingOptions {
  /**
   * Local device name to advertise
   */
  name?: string;

  /**
   * Service UUIDs to advertise
   */
  serviceUUIDs?: string[];

  /**
   * Manufacturer-specific data
   * Format: 2-byte company ID (little-endian) + payload
   * Minimum 2 bytes, maximum 27 bytes for legacy advertising
   */
  manufacturerData?: Buffer;

  /**
   * Advertising interval in milliseconds
   * Valid range: 20-10000ms
   * @default 100
   */
  interval?: number;

  /**
   * TX power level in dBm
   * @default 0
   */
  txPowerLevel?: number;
}

/**
 * Options for scanning for BLE devices
 */
export interface ScanOptions {
  /**
   * Filter devices by manufacturer company ID
   * Only devices with matching company ID in manufacturer data will be reported
   */
  filterByManufacturer?: number;

  /**
   * Filter devices by service UUID
   * Only devices advertising any of these service UUIDs will be reported
   */
  filterByService?: string[];

  /**
   * Allow duplicate device discoveries
   * @default false
   */
  allowDuplicates?: boolean;

  /**
   * Timeout in milliseconds before same device can be reported again
   * Only applies when allowDuplicates is false
   * @default 1000
   */
  duplicateTimeout?: number;
}

/**
 * Discovered BLE device information
 */
export interface DiscoveredDevice {
  /**
   * Device MAC address (platform-specific format)
   */
  address: string;

  /**
   * Device local name (if advertised)
   */
  name?: string;

  /**
   * Signal strength in dBm
   * Typical range: -100 to 0
   */
  rssi: number;

  /**
   * Manufacturer-specific data
   * Format: 2-byte company ID (little-endian) + payload
   */
  manufacturerData?: Buffer;

  /**
   * Advertised service UUIDs
   */
  serviceUUIDs?: string[];

  /**
   * Timestamp of discovery (milliseconds since epoch)
   */
  timestamp: number;
}

/**
 * BLE operation error
 */
export class BLEError extends Error {
  /**
   * Error code
   */
  code: BLEErrorCode;

  /**
   * Native platform error (if available)
   */
  nativeError?: any;

  constructor(code: BLEErrorCode, message: string, nativeError?: any) {
    super(message);
    this.name = 'BLEError';
    this.code = code;
    this.nativeError = nativeError;

    // Maintain proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BLEError);
    }
  }
}

/**
 * Event types emitted by BLEAdapter
 */
export interface BLEAdapterEvents {
  /**
   * Emitted when adapter state changes
   * @param state New adapter state
   */
  stateChange: (state: BLEState) => void;

  /**
   * Emitted when advertising starts
   * @param options The advertising options used
   */
  advertisingStarted: (options: AdvertisingOptions) => void;

  /**
   * Emitted when advertising stops
   */
  advertisingStopped: () => void;

  /**
   * Emitted when advertising data is updated
   * @param data The new manufacturer data
   */
  advertisingDataUpdated: (data: Buffer) => void;

  /**
   * Emitted when scanning starts
   * @param options The scan options used
   */
  scanningStarted: (options: ScanOptions) => void;

  /**
   * Emitted when scanning stops
   */
  scanningStopped: () => void;

  /**
   * Emitted when a device is discovered during scanning
   * @param device The discovered device
   */
  deviceDiscovered: (device: DiscoveredDevice) => void;

  /**
   * Emitted when an error occurs
   * @param error The error that occurred
   */
  error: (error: BLEError) => void;
}
