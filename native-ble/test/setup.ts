/**
 * Jest setup file - runs before all tests
 */

import './jest.d.ts';

// Extend Jest matchers
expect.extend({
  toBeValidBLEState(received: any) {
    const validStates = ['unknown', 'resetting', 'unsupported', 'unauthorized', 'poweredOff', 'poweredOn'];
    const pass = validStates.includes(received);

    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be a valid BLE state`
        : `expected ${received} to be a valid BLE state (one of: ${validStates.join(', ')})`,
    };
  },

  toBeValidBuffer(received: any) {
    const pass = Buffer.isBuffer(received);

    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be a Buffer`
        : `expected ${received} to be a Buffer`,
    };
  },

  toBeValidManufacturerData(received: any) {
    const pass = Buffer.isBuffer(received) && received.length >= 2;

    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be valid manufacturer data`
        : `expected ${received} to be a Buffer with at least 2 bytes`,
    };
  },
});

// Global test timeout
jest.setTimeout(10000);

// Mock console to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Keep error for debugging
};
