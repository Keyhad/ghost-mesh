/**
 * Test utilities and helper functions
 */

import type { DiscoveredDevice } from '../mocks/ble-adapter.mock';

/**
 * Create a test manufacturer data buffer
 */
export function createManufacturerData(companyId: number, payload: number[]): Buffer {
  const buffer = Buffer.allocUnsafe(2 + payload.length);
  buffer.writeUInt16LE(companyId, 0);

  for (let i = 0; i < payload.length; i++) {
    buffer.writeUInt8(payload[i], 2 + i);
  }

  return buffer;
}

/**
 * Create a mock discovered device
 */
export function createMockDevice(options: Partial<DiscoveredDevice> = {}): DiscoveredDevice {
  return {
    address: options.address || '00:11:22:33:44:55',
    name: options.name || 'MockDevice',
    rssi: options.rssi !== undefined ? options.rssi : -50,
    manufacturerData: options.manufacturerData,
    serviceUUIDs: options.serviceUUIDs || [],
    timestamp: options.timestamp || Date.now(),
  };
}

/**
 * Wait for an event with timeout
 */
export function waitForEvent(
  emitter: any,
  event: string,
  timeout: number = 5000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);

    emitter.once(event, (data: any) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

/**
 * Wait for multiple events
 */
export async function waitForEvents(
  emitter: any,
  event: string,
  count: number,
  timeout: number = 5000
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${count} events: ${event}`));
    }, timeout);

    const handler = (data: any) => {
      results.push(data);

      if (results.length >= count) {
        clearTimeout(timer);
        emitter.off(event, handler);
        resolve(results);
      }
    };

    emitter.on(event, handler);
  });
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  checkInterval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }

    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
}

/**
 * Delay for testing
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random MAC address
 */
export function randomMacAddress(): string {
  const bytes = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  );
  return bytes.join(':').toUpperCase();
}

/**
 * Generate random UUID
 */
export function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create test advertising options
 */
export function createAdvertisingOptions(overrides: any = {}) {
  return {
    name: 'TestDevice',
    serviceUUIDs: ['1234'],
    manufacturerData: createManufacturerData(0xFFFF, [0x01, 0x02, 0x03, 0x04]),
    interval: 100,
    txPowerLevel: 0,
    ...overrides,
  };
}

/**
 * Create test scan options
 */
export function createScanOptions(overrides: any = {}) {
  return {
    filterByManufacturer: 0,
    filterByService: [],
    allowDuplicates: false,
    duplicateTimeout: 1000,
    ...overrides,
  };
}

/**
 * Assert buffer equals
 */
export function assertBufferEquals(actual: Buffer, expected: Buffer): void {
  expect(actual.length).toBe(expected.length);

  for (let i = 0; i < actual.length; i++) {
    expect(actual[i]).toBe(expected[i]);
  }
}

/**
 * Mock console for testing
 */
export function mockConsole() {
  const originalConsole = { ...console };

  beforeEach(() => {
    global.console = {
      ...console,
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  });

  afterEach(() => {
    global.console = originalConsole;
  });
}
