# Quick Test Reference

Quick commands for running tests in the native BLE module.

## Running Tests

### All Tests
```bash
npm test
```

### With Coverage
```bash
npm test -- --coverage
open coverage/lcov-report/index.html  # View coverage report
```

### Watch Mode (Re-runs on file changes)
```bash
npm test -- --watch
```

### Specific Test Suite
```bash
npm test -- test/unit                      # Unit tests only
npm test -- test/integration               # Integration tests only
npm test -- test/performance               # Performance tests only
```

### Single Test File
```bash
npm test -- test/unit/adapter.test.ts
```

### By Pattern
```bash
npm test -- --testNamePattern="advertising"  # Tests matching "advertising"
npm test -- -t "should start advertising"    # Specific test name
```

### Verbose Output
```bash
npm test -- --verbose
```

## Test Structure

```
test/
├── README.md                          # Full testing documentation
├── setup.ts                           # Custom matchers & global setup
├── mocks/
│   └── ble-adapter.mock.ts           # Mock BLE hardware
├── helpers/
│   └── test-utils.ts                 # Utilities (events, data, delays)
├── unit/
│   └── adapter.test.ts               # BLEAdapter API tests (267 tests)
├── integration/
│   └── advertising-scanning.test.ts  # End-to-end scenarios
└── performance/
    └── performance.test.ts           # Timing & resource tests
```

## Custom Matchers

```typescript
// Validate BLE state
expect(state).toBeValidBLEState();

// Validate Buffer
expect(data).toBeValidBuffer();

// Validate manufacturer data (≥2 bytes)
expect(data).toBeValidManufacturerData();
```

## Test Utilities

```typescript
import {
  createManufacturerData,
  createMockDevice,
  waitForEvent,
  createAdvertisingOptions,
  createScanOptions,
  delay,
  randomMacAddress,
  randomUUID,
} from './helpers/test-utils';

// Create test data
const data = createManufacturerData(0xFFFF, [0x01, 0x02]);
const device = createMockDevice({ address: 'AA:BB:CC:DD:EE:FF' });
const mac = randomMacAddress();
const uuid = randomUUID();

// Wait for events
const devicePromise = waitForEvent(adapter, 'deviceDiscovered');
const devices = await waitForEvents(adapter, 'deviceDiscovered', 3);

// Create options with defaults
const advOptions = createAdvertisingOptions({ interval: 100 });
const scanOptions = createScanOptions({ filterByManufacturer: 0xFFFF });
```

## Mock Adapter

```typescript
import { createMockBLEAdapter } from './mocks/ble-adapter.mock';

const adapter = createMockBLEAdapter();

// Configure behavior
adapter.simulatedDelay = 50;              // Operation delay (ms)
adapter.shouldFailNextOperation = true;   // Simulate failure
adapter.failureError = 'Test error';      // Error message

// Add mock devices for discovery
adapter.addMockDevice(createMockDevice({ address: 'AA:BB:CC:DD:EE:FF' }));

// Simulate state changes
adapter.simulateStateChange('poweredOff');

// Check state
adapter.isAdvertisingActive();  // boolean
adapter.isScanningActive();     // boolean

// Cleanup
await adapter.destroy();
```

## Coverage Requirements

Minimum 80% coverage required for:
- ✅ Branches
- ✅ Functions
- ✅ Lines
- ✅ Statements

## CI Requirements

All must pass:
- ✅ Unit tests
- ✅ Integration tests
- ✅ Performance tests
- ✅ Coverage ≥80%
- ✅ TypeScript compilation
- ✅ ESLint
- ✅ Prettier

## Quick Examples

### Test Advertising
```typescript
test('should start advertising', async () => {
  const adapter = createMockBLEAdapter();
  const options = createAdvertisingOptions();

  await adapter.startAdvertising(options);

  expect(adapter.isAdvertisingActive()).toBe(true);
  await adapter.destroy();
});
```

### Test Scanning
```typescript
test('should discover devices', async () => {
  const adapter = createMockBLEAdapter();
  const mockDevice = createMockDevice();

  adapter.addMockDevice(mockDevice);

  const devicePromise = waitForEvent(adapter, 'deviceDiscovered');
  await adapter.startScanning(createScanOptions());

  const device = await devicePromise;
  expect(device.address).toBe(mockDevice.address);

  await adapter.destroy();
});
```

### Test Error Handling
```typescript
test('should reject invalid interval', async () => {
  const adapter = createMockBLEAdapter();
  const options = createAdvertisingOptions({ interval: 10 }); // Too low

  await expect(adapter.startAdvertising(options))
    .rejects
    .toThrow('between 20ms and 10000ms');

  await adapter.destroy();
});
```

## Debugging Failed Tests

### Test Hanging
```bash
# Run with verbose output
npm test -- --verbose

# Increase timeout for specific test
test('name', async () => {...}, 15000);  // 15 second timeout
```

### Coverage Issues
```bash
# Generate coverage report
npm test -- --coverage

# Open HTML report
open coverage/lcov-report/index.html

# Look for red (uncovered) lines
```

### Mock Issues
```typescript
// Reset mock state
adapter.clearMockDevices();
adapter.shouldFailNextOperation = false;

// Verify state
console.log('Advertising:', adapter.isAdvertisingActive());
console.log('Scanning:', adapter.isScanningActive());
console.log('State:', await adapter.getState());
```

## Performance Benchmarks

Target timings:
- **Start Advertising**: <200ms
- **Update Data**: <100ms
- **Stop Operations**: <100ms
- **Device Discovery**: <1s

Run performance tests:
```bash
npm test -- test/performance
```

---

For complete documentation, see [test/README.md](test/README.md)
