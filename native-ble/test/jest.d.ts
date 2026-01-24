import '@jest/globals';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidBLEState(): R;
      toBeValidBuffer(): R;
      toBeValidManufacturerData(): R;
    }
  }
}

export {};
