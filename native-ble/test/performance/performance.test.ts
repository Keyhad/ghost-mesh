/**
 * Performance tests for BLE operations
 * Validates timing and resource usage requirements
 */

import { createMockBLEAdapter, MockBLEAdapterNative } from '../mocks/ble-adapter.mock';
import {
  createManufacturerData,
  createMockDevice,
  waitForEvent,
  createAdvertisingOptions,
  createScanOptions,
  delay,
} from '../helpers/test-utils';

describe('Performance Tests', () => {
  let adapter: MockBLEAdapterNative;

  beforeEach(() => {
    adapter = createMockBLEAdapter();
    // Set simulated delay to 0 for performance tests
    adapter.simulatedDelay = 0;
  });

  afterEach(async () => {
    await adapter.destroy();
  });

  describe('Advertising Performance', () => {
    test('should start advertising within 200ms', async () => {
      const options = createAdvertisingOptions();

      const startTime = Date.now();
      await adapter.startAdvertising(options);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200);
    });

    test('should update advertising data within 100ms', async () => {
      const options = createAdvertisingOptions();
      await adapter.startAdvertising(options);

      const newData = createManufacturerData(0xFFFF, [0x05, 0x06, 0x07]);

      const startTime = Date.now();
      await adapter.updateAdvertisingData(newData);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    test('should stop advertising within 100ms', async () => {
      const options = createAdvertisingOptions();
      await adapter.startAdvertising(options);

      const startTime = Date.now();
      await adapter.stopAdvertising();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    test('should handle rapid start/stop cycles', async () => {
      const options = createAdvertisingOptions();

      // 10 rapid cycles
      for (let i = 0; i < 10; i++) {
        await adapter.startAdvertising(options);
        await adapter.stopAdvertising();
      }

      expect(adapter.isAdvertisingActive()).toBe(false);
    });

    test('should handle rapid data updates', async () => {
      const options = createAdvertisingOptions();
      await adapter.startAdvertising(options);

      // 20 rapid updates
      for (let i = 0; i < 20; i++) {
        const newData = createManufacturerData(0xFFFF, [i, i + 1, i + 2]);
        await adapter.updateAdvertisingData(newData);
      }

      expect(adapter.isAdvertisingActive()).toBe(true);
    });
  });

  describe('Scanning Performance', () => {
    test('should start scanning within 200ms', async () => {
      const options = createScanOptions();

      const startTime = Date.now();
      await adapter.startScanning(options);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200);
    });

    test('should stop scanning within 100ms', async () => {
      const options = createScanOptions();
      await adapter.startScanning(options);

      const startTime = Date.now();
      await adapter.stopScanning();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    test('should handle rapid start/stop cycles', async () => {
      const options = createScanOptions();

      // 10 rapid cycles
      for (let i = 0; i < 10; i++) {
        await adapter.startScanning(options);
        await adapter.stopScanning();
      }

      expect(adapter.isScanningActive()).toBe(false);
    });

    test('should discover devices promptly', async () => {
      const mockDevice = createMockDevice();
      adapter.addMockDevice(mockDevice);

      const options = createScanOptions();
      const devicePromise = waitForEvent(adapter, 'deviceDiscovered');

      const startTime = Date.now();
      await adapter.startScanning(options);
      await devicePromise;
      const duration = Date.now() - startTime;

      // Should discover within 1 second
      expect(duration).toBeLessThan(1000);
    });

    test('should handle high volume device discovery', async () => {
      // Add 100 mock devices
      for (let i = 0; i < 100; i++) {
        adapter.addMockDevice(createMockDevice({
          address: `AA:BB:CC:DD:EE:${i.toString(16).padStart(2, '0')}`,
          name: `Device${i}`,
        }));
      }

      const options = createScanOptions();
      await adapter.startScanning(options);

      // Wait a bit for discovery
      await delay(500);

      // Should still be responsive
      const startTime = Date.now();
      await adapter.stopScanning();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('State Change Performance', () => {
    test('should handle rapid state changes', async () => {
      const states = ['poweredOn', 'poweredOff', 'poweredOn', 'resetting', 'poweredOn'] as const;

      for (const state of states) {
        adapter.simulateStateChange(state);
        const currentState = await adapter.getState();
        expect(currentState).toBe(state);
      }
    });

    test('should emit state change events promptly', async () => {
      const startTime = Date.now();
      const eventPromise = waitForEvent(adapter, 'stateChange');

      adapter.simulateStateChange('poweredOff');
      await eventPromise;

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Event Handling Performance', () => {
    test('should handle high frequency events', async () => {
      const eventCount = 1000;
      let receivedCount = 0;

      adapter.on('stateChange', () => {
        receivedCount++;
      });

      const startTime = Date.now();

      for (let i = 0; i < eventCount; i++) {
        adapter.simulateStateChange(i % 2 === 0 ? 'poweredOn' : 'poweredOff');
      }

      const duration = Date.now() - startTime;

      expect(receivedCount).toBe(eventCount);
      expect(duration).toBeLessThan(1000); // Should handle 1000 events in < 1s
    });

    test('should handle multiple simultaneous listeners', async () => {
      const listenerCount = 50;
      const listeners: jest.Mock[] = [];

      for (let i = 0; i < listenerCount; i++) {
        const listener = jest.fn();
        adapter.on('stateChange', listener);
        listeners.push(listener);
      }

      adapter.simulateStateChange('poweredOff');

      // All listeners should be called
      listeners.forEach(listener => {
        expect(listener).toHaveBeenCalledWith('poweredOff');
      });
    });
  });

  describe('Memory Efficiency', () => {
    test('should not leak event listeners', async () => {
      const initialCount = adapter.listenerCount('deviceDiscovered');

      // Add and remove listeners
      for (let i = 0; i < 100; i++) {
        const listener = jest.fn();
        adapter.on('deviceDiscovered', listener);
        adapter.off('deviceDiscovered', listener);
      }

      const finalCount = adapter.listenerCount('deviceDiscovered');
      expect(finalCount).toBe(initialCount);
    });

    test('should clear all listeners on destroy', async () => {
      // Add various listeners
      adapter.on('stateChange', jest.fn());
      adapter.on('deviceDiscovered', jest.fn());
      adapter.on('advertisingStarted', jest.fn());
      adapter.on('scanningStarted', jest.fn());

      await adapter.destroy();

      // All listener counts should be 0
      expect(adapter.listenerCount('stateChange')).toBe(0);
      expect(adapter.listenerCount('deviceDiscovered')).toBe(0);
      expect(adapter.listenerCount('advertisingStarted')).toBe(0);
      expect(adapter.listenerCount('scanningStarted')).toBe(0);
    });

    test('should handle device list cleanup', async () => {
      // Add many devices
      for (let i = 0; i < 1000; i++) {
        adapter.addMockDevice(createMockDevice({
          address: `AA:BB:CC:DD:${Math.floor(i / 256).toString(16).padStart(2, '0')}:${(i % 256).toString(16).padStart(2, '0')}`,
        }));
      }

      // Clear should be fast
      const startTime = Date.now();
      adapter.clearMockDevices();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10);
    });
  });

  describe('Concurrent Operations Performance', () => {
    test('should handle concurrent advertising and scanning', async () => {
      const advOptions = createAdvertisingOptions();
      const scanOptions = createScanOptions();

      // Add mock device for discovery
      adapter.addMockDevice(createMockDevice());

      const startTime = Date.now();

      // Start both operations
      await Promise.all([
        adapter.startAdvertising(advOptions),
        adapter.startScanning(scanOptions),
      ]);

      const duration = Date.now() - startTime;

      expect(adapter.isAdvertisingActive()).toBe(true);
      expect(adapter.isScanningActive()).toBe(true);
      expect(duration).toBeLessThan(300); // Both should start within 300ms
    });

    test('should handle concurrent stop operations', async () => {
      const advOptions = createAdvertisingOptions();
      const scanOptions = createScanOptions();

      await adapter.startAdvertising(advOptions);
      await adapter.startScanning(scanOptions);

      const startTime = Date.now();

      // Stop both operations
      await Promise.all([
        adapter.stopAdvertising(),
        adapter.stopScanning(),
      ]);

      const duration = Date.now() - startTime;

      expect(adapter.isAdvertisingActive()).toBe(false);
      expect(adapter.isScanningActive()).toBe(false);
      expect(duration).toBeLessThan(200); // Both should stop within 200ms
    });
  });
});
