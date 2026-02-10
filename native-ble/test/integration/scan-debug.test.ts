import '../setup';

import { createMockBLEAdapter } from '../mocks/ble-adapter.mock';
import { createAdvertisingOptions, createMockDevice, createScanOptions, waitForEvent } from '../helpers/test-utils';

describe('Scan Debug (prints discovered devices)', () => {
  test('scan debug prints advertisements', async () => {
    const advertiser = createMockBLEAdapter();
    const scanner = createMockBLEAdapter();

    try {
      const advOptions = createAdvertisingOptions({ name: 'DebugAdvertiser' });
      await advertiser.startAdvertising(advOptions);

      // Add a mock device to the scanner that represents the advertiser
      scanner.addMockDevice(createMockDevice({
        address: 'AA:BB:CC:11:22:33',
        name: advOptions.name,
        manufacturerData: advOptions.manufacturerData,
        serviceUUIDs: advOptions.serviceUUIDs,
      }));

      // Print any discoveries to console
      scanner.on('deviceDiscovered', (device: any) => {
        // Log full advertisement object
        // eslint-disable-next-line no-console
        console.log('[scan-debug] deviceDiscovered ->', JSON.stringify(device, (_, v) => {
          // Buffers are not JSON-friendly; show as hex
          if (v && typeof v === 'object' && v.type === 'Buffer') return Buffer.from(v.data).toString('hex');
          return v;
        }, 2));
      });

      // Start scanning and wait for first discovery
      await scanner.startScanning(createScanOptions());
      const discovered = await waitForEvent(scanner, 'deviceDiscovered', 5000);

      // Print a final summary
      // eslint-disable-next-line no-console
      console.log('[scan-debug] first discovered (summary):', discovered);

      expect(discovered).toBeDefined();
    } finally {
      await advertiser.stopAdvertising().catch(() => {});
      await scanner.stopScanning().catch(() => {});
      await advertiser.destroy().catch(() => {});
      await scanner.destroy().catch(() => {});
    }
  }, 10000);
});
