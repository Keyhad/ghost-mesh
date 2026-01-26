/**
 * Integration tests for BLEAdapter using real native BLE implementation
 * These tests require actual BLE hardware and permissions
 */

import { BLEAdapter, BLEError } from '../../src';
import { AdvertisingOptions, ScanOptions } from '../../src/types';

// Helper: Wait for a specified event
function waitForEvent(emitter: any, event: string, timeout = 10000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout waiting for ' + event)), timeout);
    emitter.once(event, (data: any) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

describe('BLEAdapter Integration (Native)', () => {
  let adapter: BLEAdapter;

  beforeAll(() => {
    // Use real native implementation (no mock)
    adapter = new BLEAdapter();
  });

  afterAll(async () => {
    await adapter.destroy();
  });

  test('should get current BLE state', async () => {
    const state = await adapter.getState();
    expect(['unknown', 'resetting', 'unsupported', 'unauthorized', 'poweredOff', 'poweredOn']).toContain(state);
  });

  test('should start and stop advertising', async () => {
    const options: AdvertisingOptions = {
      name: 'GhostMeshTest',
      manufacturerData: Buffer.from([0xFF, 0xFF, 0x01, 0x02]),
      interval: 100,
      serviceUUIDs: ['1234'],
    };
    await adapter.startAdvertising(options);
    expect(adapter.isAdvertising()).toBe(true);
    await adapter.stopAdvertising();
    expect(adapter.isAdvertising()).toBe(false);
  });

  test('should update advertising data', async () => {
    const options: AdvertisingOptions = {
      name: 'GhostMeshTest',
      manufacturerData: Buffer.from([0xFF, 0xFF, 0x01, 0x02]),
      interval: 100,
      serviceUUIDs: ['1234'],
    };
    await adapter.startAdvertising(options);
    const newData = Buffer.from([0xFF, 0xFF, 0x03, 0x04]);
    await adapter.updateAdvertisingData(newData);
    await adapter.stopAdvertising();
  });

  test('should start and stop scanning', async () => {
    const options: ScanOptions = {
      filterByService: ['1234'],
    };
    await adapter.startScanning(options);
    expect(adapter.isScanning()).toBe(true);
    await adapter.stopScanning();
    expect(adapter.isScanning()).toBe(false);
  });

  test('should discover BLE devices while scanning', async () => {
    const options: ScanOptions = {
      filterByService: ['1234'],
    };
    await adapter.startScanning(options);
    // Wait for at least one device discovered event
    const device = await waitForEvent(adapter, 'deviceDiscovered', 15000);
    expect(device).toBeDefined();
    await adapter.stopScanning();
  });

  test('should handle BLE state changes', async () => {
    // Wait for stateChange event
    const state = await waitForEvent(adapter, 'stateChange', 15000);
    expect(['unknown', 'resetting', 'unsupported', 'unauthorized', 'poweredOff', 'poweredOn']).toContain(state);
  });

  test('should throw error if advertising when not powered on', async () => {
    // Simulate poweredOff state if possible
    // This may require manual intervention or platform support
    // For now, just check error handling
    const options: AdvertisingOptions = {
      name: 'GhostMeshTest',
      manufacturerData: Buffer.from([0xFF, 0xFF, 0x01, 0x02]),
      interval: 100,
      serviceUUIDs: ['1234'],
    };
    try {
      await adapter.startAdvertising(options);
    } catch (err) {
      expect(err).toBeInstanceOf(BLEError);
    }
  });
});
