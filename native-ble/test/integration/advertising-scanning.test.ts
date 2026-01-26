
import '../setup';
/**
 * Integration tests for advertising and scanning
 * Tests end-to-end communication between devices
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

describe('Advertising and Scanning Integration', () => {
  let advertiser: MockBLEAdapterNative;
  let scanner: MockBLEAdapterNative;

  beforeEach(() => {
    advertiser = createMockBLEAdapter();
    scanner = createMockBLEAdapter();
  });

  afterEach(async () => {
    await advertiser.destroy();
    await scanner.destroy();
  });

  describe('Device Discovery', () => {
    test('scanner should discover advertiser', async () => {
      // Start advertising
      const advOptions = createAdvertisingOptions({
        name: 'TestAdvertiser',
        manufacturerData: createManufacturerData(0xFFFF, [0x01, 0x02, 0x03]),
      });
      await advertiser.startAdvertising(advOptions);

      // Add advertiser as discoverable device
      scanner.addMockDevice(createMockDevice({
        address: 'AA:BB:CC:DD:EE:FF',
        name: 'TestAdvertiser',
        manufacturerData: advOptions.manufacturerData,
      }));

      // Start scanning
      const scanOptions = createScanOptions();
      const devicePromise = waitForEvent(scanner, 'deviceDiscovered');
      await scanner.startScanning(scanOptions);

      // Verify discovery
      const discoveredDevice = await devicePromise;
      expect(discoveredDevice.name).toBe('TestAdvertiser');
      expect(discoveredDevice.manufacturerData).toEqual(advOptions.manufacturerData);
    });

    test('scanner should discover updated advertising data', async () => {
      // Start advertising with initial data
      const initialData = createManufacturerData(0xFFFF, [0x01, 0x02]);
      const advOptions = createAdvertisingOptions({
        name: 'TestAdvertiser',
        manufacturerData: initialData,
      });
      await advertiser.startAdvertising(advOptions);

      // Set up scanner with initial device
      scanner.addMockDevice(createMockDevice({
        address: 'AA:BB:CC:DD:EE:FF',
        name: 'TestAdvertiser',
        manufacturerData: initialData,
      }));

      const scanOptions = createScanOptions();
      await scanner.startScanning(scanOptions);

      // Wait for initial discovery
      await waitForEvent(scanner, 'deviceDiscovered');

      // Update advertising data
      const newData = createManufacturerData(0xFFFF, [0x03, 0x04]);
      await advertiser.updateAdvertisingData(newData);

      // Update mock device to reflect new data
      scanner.clearMockDevices();
      scanner.addMockDevice(createMockDevice({
        address: 'AA:BB:CC:DD:EE:FF',
        name: 'TestAdvertiser',
        manufacturerData: newData,
      }));

      // Wait for updated discovery
      const devicePromise = waitForEvent(scanner, 'deviceDiscovered');
      const discoveredDevice = await devicePromise;

      expect(discoveredDevice.manufacturerData).toEqual(newData);
    });

    test('multiple scanners should discover same advertiser', async () => {
      const scanner2 = createMockBLEAdapter();

      try {
        // Start advertising
        const advOptions = createAdvertisingOptions({
          name: 'SharedAdvertiser',
          manufacturerData: createManufacturerData(0xFFFF, [0x01]),
        });
        await advertiser.startAdvertising(advOptions);

        // Add to both scanners
        const mockDevice = createMockDevice({
          address: 'AA:BB:CC:DD:EE:FF',
          name: 'SharedAdvertiser',
          manufacturerData: advOptions.manufacturerData,
        });
        scanner.addMockDevice(mockDevice);
        scanner2.addMockDevice(mockDevice);

        // Start both scanners
        const scanOptions = createScanOptions();
        const device1Promise = waitForEvent(scanner, 'deviceDiscovered');
        const device2Promise = waitForEvent(scanner2, 'deviceDiscovered');

        await scanner.startScanning(scanOptions);
        await scanner2.startScanning(scanOptions);

        // Both should discover
        const [device1, device2] = await Promise.all([device1Promise, device2Promise]);

        expect(device1.address).toBe(mockDevice.address);
        expect(device2.address).toBe(mockDevice.address);
      } finally {
        await scanner2.destroy();
      }
    });
  });

  describe('Filtering', () => {
    test('scanner should filter by manufacturer ID', async () => {
      // Start advertising with specific manufacturer ID
      const advOptions = createAdvertisingOptions({
        name: 'FilteredAdvertiser',
        manufacturerData: createManufacturerData(0xABCD, [0x01, 0x02]),
      });
      await advertiser.startAdvertising(advOptions);

      // Add matching and non-matching devices
      scanner.addMockDevice(createMockDevice({
        address: 'AA:AA:AA:AA:AA:AA',
        name: 'FilteredAdvertiser',
        manufacturerData: createManufacturerData(0xABCD, [0x01, 0x02]),
      }));
      scanner.addMockDevice(createMockDevice({
        address: 'BB:BB:BB:BB:BB:BB',
        name: 'OtherAdvertiser',
        manufacturerData: createManufacturerData(0x1234, [0x01, 0x02]),
      }));

      // Scan with filter
      const scanOptions = createScanOptions({ filterByManufacturer: 0xABCD });
      const devicePromise = waitForEvent(scanner, 'deviceDiscovered');
      await scanner.startScanning(scanOptions);

      // Should only discover matching device
      const discoveredDevice = await devicePromise;
      expect(discoveredDevice.address).toBe('AA:AA:AA:AA:AA:AA');
    });

    test('scanner should filter by service UUID', async () => {
      // Start advertising with specific service UUID
      const advOptions = createAdvertisingOptions({
        name: 'ServiceAdvertiser',
        serviceUUIDs: ['1234-5678-90ab-cdef'],
      });
      await advertiser.startAdvertising(advOptions);

      // Add matching and non-matching devices
      scanner.addMockDevice(createMockDevice({
        address: 'AA:AA:AA:AA:AA:AA',
        name: 'ServiceAdvertiser',
        serviceUUIDs: ['1234-5678-90ab-cdef'],
      }));
      scanner.addMockDevice(createMockDevice({
        address: 'BB:BB:BB:BB:BB:BB',
        name: 'OtherAdvertiser',
        serviceUUIDs: ['abcd-efgh-ijkl-mnop'],
      }));

      // Scan with filter
      const scanOptions = createScanOptions({
        filterByService: ['1234-5678-90ab-cdef'],
      });
      const devicePromise = waitForEvent(scanner, 'deviceDiscovered');
      await scanner.startScanning(scanOptions);

      // Should only discover matching device
      const discoveredDevice = await devicePromise;
      expect(discoveredDevice.address).toBe('AA:AA:AA:AA:AA:AA');
    });
  });

  describe('Concurrent Operations', () => {
    test('device should advertise and scan simultaneously', async () => {
      const device = createMockBLEAdapter();

      try {
        // Start advertising
        const advOptions = createAdvertisingOptions({
          name: 'DualModeDevice',
          manufacturerData: createManufacturerData(0xFFFF, [0x01]),
        });
        await device.startAdvertising(advOptions);

        // Add external device to discover
        device.addMockDevice(createMockDevice({
          address: 'AA:AA:AA:AA:AA:AA',
          name: 'ExternalDevice',
        }));

        // Start scanning
        const scanOptions = createScanOptions();
        const devicePromise = waitForEvent(device, 'deviceDiscovered');
        await device.startScanning(scanOptions);

        // Should be doing both
        expect(device.isAdvertisingActive()).toBe(true);
        expect(device.isScanningActive()).toBe(true);

        // Should discover external device
        const discoveredDevice = await devicePromise;
        expect(discoveredDevice.address).toBe('AA:AA:AA:AA:AA:AA');
      } finally {
        await device.destroy();
      }
    });
  });

  describe('State Synchronization', () => {
    test('advertising should stop when powered off', async () => {
      // Start advertising
      const advOptions = createAdvertisingOptions();
      await advertiser.startAdvertising(advOptions);
      expect(advertiser.isAdvertisingActive()).toBe(true);

      // Simulate power off
      advertiser.simulateStateChange('poweredOff');
      await delay(150); // Wait for simulated delay

      // Advertising should be stopped
      expect(advertiser.isAdvertisingActive()).toBe(false);
    });

    test('scanning should stop when powered off', async () => {
      // Start scanning
      const scanOptions = createScanOptions();
      await scanner.startScanning(scanOptions);
      expect(scanner.isScanningActive()).toBe(true);

      // Simulate power off
      scanner.simulateStateChange('poweredOff');
      await delay(150); // Wait for simulated delay

      // Scanning should be stopped
      expect(scanner.isScanningActive()).toBe(false);
    });

    test('operations should resume when powered back on', async () => {
      // Start in powered on state
      const advOptions = createAdvertisingOptions();
      await advertiser.startAdvertising(advOptions);

      // Power off
      advertiser.simulateStateChange('poweredOff');
      await delay(150);

      // Power back on
      advertiser.simulateStateChange('poweredOn');

      // Should be able to start advertising again
      await expect(advertiser.startAdvertising(advOptions)).resolves.not.toThrow();
    });
  });

  describe('Data Integrity', () => {
    test('manufacturer data should be transmitted correctly', async () => {
      const testData = createManufacturerData(0xFFFF, [0x01, 0x02, 0x03, 0x04, 0x05]);

      // Start advertising
      const advOptions = createAdvertisingOptions({
        manufacturerData: testData,
      });
      await advertiser.startAdvertising(advOptions);

      // Add to scanner
      scanner.addMockDevice(createMockDevice({
        address: 'AA:BB:CC:DD:EE:FF',
        manufacturerData: testData,
      }));

      // Scan and verify
      const scanOptions = createScanOptions();
      const devicePromise = waitForEvent(scanner, 'deviceDiscovered');
      await scanner.startScanning(scanOptions);

      const discoveredDevice = await devicePromise;
      expect(discoveredDevice.manufacturerData).toBeValidManufacturerData();
      expect(discoveredDevice.manufacturerData).toEqual(testData);
    });

    test('large manufacturer data should be transmitted correctly', async () => {
      // Create maximum size data (27 bytes for manufacturer data)
      const payload = Array.from({ length: 25 }, (_, i) => i);
      const testData = createManufacturerData(0xFFFF, payload);

      // Start advertising
      const advOptions = createAdvertisingOptions({
        manufacturerData: testData,
      });
      await advertiser.startAdvertising(advOptions);

      // Add to scanner
      scanner.addMockDevice(createMockDevice({
        address: 'AA:BB:CC:DD:EE:FF',
        manufacturerData: testData,
      }));

      // Scan and verify
      const scanOptions = createScanOptions();
      const devicePromise = waitForEvent(scanner, 'deviceDiscovered');
      await scanner.startScanning(scanOptions);

      const discoveredDevice = await devicePromise;
      expect(discoveredDevice.manufacturerData).toEqual(testData);
      expect(discoveredDevice.manufacturerData.length).toBe(27);
    });
  });
});
