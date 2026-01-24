/**
 * Unit tests for BLEAdapter TypeScript API
 * Tests the interface layer using mock native implementation
 */

import { BLEAdapter, BLEError } from '../../src';
import { createMockBLEAdapter } from '../mocks/ble-adapter.mock';
import {
  createManufacturerData,
  createMockDevice,
  waitForEvent,
  waitForEvents,
  createAdvertisingOptions,
  createScanOptions,
  delay,
} from '../helpers/test-utils';

let adapter: BLEAdapter;

describe('BLEAdapter TypeScript Interface', () => {
  beforeEach(() => {
    // Create BLEAdapter with mock native implementation
    const mockNative = createMockBLEAdapter();
    adapter = new BLEAdapter(mockNative);
  });

  afterEach(async () => {
    await adapter.destroy();
  });

  describe('Constructor and Initialization', () => {
    test('should create instance with mock native adapter', () => {
      expect(adapter).toBeInstanceOf(BLEAdapter);
    });

    test('should start in not advertising state', () => {
      expect(adapter.isAdvertising()).toBe(false);
    });

    test('should start in not scanning state', () => {
      expect(adapter.isScanning()).toBe(false);
    });
  });

  describe('State Management', () => {
    test('should get current state', async () => {
      const state = await adapter.getState();
      expect(['unknown', 'resetting', 'unsupported', 'unauthorized', 'poweredOff', 'poweredOn']).toContain(state);
      expect(state).toBe('poweredOn');
    });

    test('should emit stateChange event', async () => {
      const stateChangePromise = waitForEvent(adapter, 'stateChange');

      // Simulate state change via native adapter
      const nativeAdapter = (adapter as any).nativeAdapter;
      nativeAdapter.simulateStateChange('poweredOff');

      const newState = await stateChangePromise;
      expect(newState).toBe('poweredOff');
    });

    test('should handle all valid BLE states', async () => {
      const states = ['unknown', 'resetting', 'unsupported', 'unauthorized', 'poweredOff', 'poweredOn'] as const;
      const nativeAdapter = (adapter as any).nativeAdapter;

      for (const state of states) {
        nativeAdapter.simulateStateChange(state);
        const currentState = await adapter.getState();
        expect(currentState).toBe(state);
      }
    });
  });

  describe('Advertising - Parameter Validation', () => {
    test('should validate advertising interval - too low', async () => {
      const options = createAdvertisingOptions({ interval: 10 });

      await expect(adapter.startAdvertising(options))
        .rejects
        .toThrow('between 20ms and 10000ms');
    });

    test('should validate advertising interval - too high', async () => {
      const options = createAdvertisingOptions({ interval: 20000 });

      await expect(adapter.startAdvertising(options))
        .rejects
        .toThrow('between 20ms and 10000ms');
    });

    test('should validate manufacturer data is Buffer', async () => {
      const options = createAdvertisingOptions({ manufacturerData: 'invalid' as any });

      await expect(adapter.startAdvertising(options))
        .rejects
        .toThrow('must be a Buffer');
    });

    test('should validate manufacturer data minimum length', async () => {
      const options = createAdvertisingOptions({ manufacturerData: Buffer.from([0xFF]) });

      await expect(adapter.startAdvertising(options))
        .rejects
        .toThrow('at least 2 bytes');
    });

    test('should validate manufacturer data maximum length', async () => {
      const tooLargeData = Buffer.alloc(28, 0xFF);
      const options = createAdvertisingOptions({ manufacturerData: tooLargeData });

      await expect(adapter.startAdvertising(options))
        .rejects
        .toThrow('must not exceed 27 bytes');
    });

    test('should validate serviceUUIDs is array', async () => {
      const options = createAdvertisingOptions({ serviceUUIDs: 'invalid' as any });

      await expect(adapter.startAdvertising(options))
        .rejects
        .toThrow('must be an array');
    });
  });

  describe('Advertising - Operations', () => {
    test('should start advertising with valid options', async () => {
      const options = createAdvertisingOptions();

      await adapter.startAdvertising(options);

      expect(adapter.isAdvertising()).toBe(true);
    });

    test('should emit advertisingStarted event', async () => {
      const options = createAdvertisingOptions();
      const eventPromise = waitForEvent(adapter, 'advertisingStarted');

      await adapter.startAdvertising(options);

      const emittedOptions = await eventPromise;
      expect(emittedOptions).toEqual(options);
    });

    test('should update advertising data', async () => {
      const options = createAdvertisingOptions();
      await adapter.startAdvertising(options);

      const newData = createManufacturerData(0xFFFF, [0x05, 0x06, 0x07]);
      await adapter.updateAdvertisingData(newData);

      expect(adapter.isAdvertising()).toBe(true);
    });

    test('should emit advertisingDataUpdated event', async () => {
      const options = createAdvertisingOptions();
      await adapter.startAdvertising(options);

      const newData = createManufacturerData(0xFFFF, [0x05, 0x06, 0x07]);
      const eventPromise = waitForEvent(adapter, 'advertisingDataUpdated');

      await adapter.updateAdvertisingData(newData);

      const emittedData = await eventPromise;
      expect(emittedData).toEqual(newData);
    });

    test('should stop advertising', async () => {
      const options = createAdvertisingOptions();
      await adapter.startAdvertising(options);

      await adapter.stopAdvertising();

      expect(adapter.isAdvertising()).toBe(false);
    });

    test('should emit advertisingStopped event', async () => {
      const options = createAdvertisingOptions();
      await adapter.startAdvertising(options);

      const eventPromise = waitForEvent(adapter, 'advertisingStopped');
      await adapter.stopAdvertising();

      await eventPromise;
    });
  });

  describe('Update Advertising Data - Validation', () => {
    test('should validate data is Buffer', async () => {
      const options = createAdvertisingOptions();
      await adapter.startAdvertising(options);

      await expect(adapter.updateAdvertisingData('invalid' as any))
        .rejects
        .toThrow('must be a Buffer');
    });

    test('should validate data minimum length', async () => {
      const options = createAdvertisingOptions();
      await adapter.startAdvertising(options);

      const invalidData = Buffer.from([0xFF]);

      await expect(adapter.updateAdvertisingData(invalidData))
        .rejects
        .toThrow('at least 2 bytes');
    });
  });

  describe('Scanning - Parameter Validation', () => {
    test('should validate manufacturer ID range - negative', async () => {
      const options = createScanOptions({ filterByManufacturer: -1 });

      await expect(adapter.startScanning(options))
        .rejects
        .toThrow('between 0 and 0xFFFF');
    });

    test('should validate manufacturer ID range - too high', async () => {
      const options = createScanOptions({ filterByManufacturer: 0x10000 });

      await expect(adapter.startScanning(options))
        .rejects
        .toThrow('between 0 and 0xFFFF');
    });

    test('should validate filterByService is array', async () => {
      const options = createScanOptions({ filterByService: 'invalid' as any });

      await expect(adapter.startScanning(options))
        .rejects
        .toThrow('must be an array');
    });

    test('should validate duplicateTimeout is positive', async () => {
      const options = createScanOptions({ duplicateTimeout: -100 });

      await expect(adapter.startScanning(options))
        .rejects
        .toThrow('must be a positive number');
    });
  });

  describe('Scanning - Operations', () => {
    test('should start scanning with valid options', async () => {
      const options = createScanOptions();

      await adapter.startScanning(options);

      expect(adapter.isScanning()).toBe(true);
    });

    test('should start scanning with empty options', async () => {
      await adapter.startScanning();

      expect(adapter.isScanning()).toBe(true);
    });

    test('should emit scanningStarted event', async () => {
      const options = createScanOptions();
      const eventPromise = waitForEvent(adapter, 'scanningStarted');

      await adapter.startScanning(options);

      const emittedOptions = await eventPromise;
      expect(emittedOptions).toEqual(options);
    });

    test('should discover devices', async () => {
      const mockDevice = createMockDevice();
      const nativeAdapter = (adapter as any).nativeAdapter;
      nativeAdapter.addMockDevice(mockDevice);

      const devicePromise = waitForEvent(adapter, 'deviceDiscovered');
      await adapter.startScanning();

      const device = await devicePromise;
      expect(device.address).toBe(mockDevice.address);
    });

    test('should stop scanning', async () => {
      await adapter.startScanning();

      await adapter.stopScanning();

      expect(adapter.isScanning()).toBe(false);
    });

    test('should emit scanningStopped event', async () => {
      await adapter.startScanning();

      const eventPromise = waitForEvent(adapter, 'scanningStopped');
      await adapter.stopScanning();

      await eventPromise;
    });
  });

  describe('Concurrent Operations', () => {
    test('should allow advertising and scanning simultaneously', async () => {
      const advOptions = createAdvertisingOptions();
      const scanOptions = createScanOptions();

      await adapter.startAdvertising(advOptions);
      await adapter.startScanning(scanOptions);

      expect(adapter.isAdvertising()).toBe(true);
      expect(adapter.isScanning()).toBe(true);
    });

    test('should stop operations independently', async () => {
      const advOptions = createAdvertisingOptions();
      const scanOptions = createScanOptions();

      await adapter.startAdvertising(advOptions);
      await adapter.startScanning(scanOptions);

      await adapter.stopAdvertising();

      expect(adapter.isAdvertising()).toBe(false);
      expect(adapter.isScanning()).toBe(true);

      await adapter.stopScanning();

      expect(adapter.isScanning()).toBe(false);
    });
  });

  describe('Cleanup', () => {
    test('should stop all operations on destroy', async () => {
      const advOptions = createAdvertisingOptions();
      const scanOptions = createScanOptions();

      await adapter.startAdvertising(advOptions);
      await adapter.startScanning(scanOptions);

      await adapter.destroy();

      expect(adapter.isAdvertising()).toBe(false);
      expect(adapter.isScanning()).toBe(false);
    });

    test('should remove all listeners on destroy', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      adapter.on('stateChange', listener1);
      adapter.on('deviceDiscovered', listener2);

      await adapter.destroy();

      const nativeAdapter = (adapter as any).nativeAdapter;
      nativeAdapter.simulateStateChange('poweredOff');
      nativeAdapter.simulateDeviceDiscovery(createMockDevice());

      // Wait a bit to ensure no events are emitted
      await delay(50);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should emit error events from native adapter', async () => {
      const errorPromise = waitForEvent(adapter, 'error');
      const nativeAdapter = (adapter as any).nativeAdapter;

      const testError = new BLEError('OPERATION_FAILED', 'Test error');
      nativeAdapter.emit('error', testError);

      const emittedError = await errorPromise;
      expect(emittedError).toBeInstanceOf(BLEError);
      expect(emittedError.code).toBe('OPERATION_FAILED');
    });
  });

  describe('Type Safety', () => {
    test('should have correct event types', () => {
      // These should compile without errors
      adapter.on('stateChange', (state) => {
        const _: string = state; // Should be string (BLEState)
      });

      adapter.on('deviceDiscovered', (device) => {
        const _: string = device.address; // Should have address property
      });

      adapter.on('advertisingStarted', (options) => {
        const _: number | undefined = options.interval; // Should have optional interval
      });
    });
  });
});
