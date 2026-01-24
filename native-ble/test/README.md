# Testing Documentation

This document describes the testing strategy and infrastructure for the native BLE module.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Mock Infrastructure](#mock-infrastructure)
- [Coverage Requirements](#coverage-requirements)
- [Continuous Integration](#continuous-integration)

## Overview

The testing infrastructure uses Jest as the test runner with the following key features:

- **TypeScript Support**: Tests are written in TypeScript using ts-jest
- **Mock Infrastructure**: Complete BLE hardware simulation without requiring physical adapters
- **Custom Matchers**: BLE-specific assertions for cleaner test code
- **Coverage Tracking**: 80% minimum coverage for all metrics
- **Performance Testing**: Validates timing requirements (<200ms start, <100ms update)
- **Integration Testing**: End-to-end advertising and scanning scenarios

## Test Structure

```plain
test/
├── setup.ts                          # Global setup and custom matchers
├── mocks/
│   └── ble-adapter.mock.ts          # Mock BLE native addon
├── helpers/
│   └── test-utils.ts                # Reusable test utilities
├── unit/
│   └── adapter.test.ts              # Unit tests for BLEAdapter API
├── integration/
│   └── advertising-scanning.test.ts # Integration tests
└── performance/
    └── performance.test.ts          # Performance benchmarks
```

### Test Categories

#### Unit Tests (`test/unit/`)

Tests individual components in isolation using mocks:

- BLEAdapter API methods
- State management
- Event emission
- Error handling
- Parameter validation

#### Integration Tests (`test/integration/`)

Tests interaction between components:

- Advertising → Scanning discovery
- Data integrity end-to-end
- Filtering mechanisms
- Concurrent operations
- State synchronization

#### Performance Tests (`test/performance/`)

Validates performance requirements:
- Advertising start time (<200ms)
- Data update time (<100ms)
- Stop operation time (<100ms)
- Event handling throughput
- Memory efficiency

## Running Tests

### Run All Tests

```bash
cd native-ble
npm test
```

### Run Specific Test Suite

```bash
# Unit tests only
npm test -- test/unit

# Integration tests only
npm test -- test/integration

# Performance tests only
npm test -- test/performance
```

### Run Single Test File

```bash
npm test -- test/unit/adapter.test.ts
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Generate Coverage Report

```bash
npm test -- --coverage
```

Coverage reports are generated in `coverage/` directory:

- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI tools

### Run Tests with Verbose Output

```bash
npm test -- --verbose
```

## Writing Tests

### Basic Test Structure

```typescript
import { createMockBLEAdapter } from '../mocks/ble-adapter.mock';
import { createAdvertisingOptions, waitForEvent } from '../helpers/test-utils';

describe('MyFeature', () => {
  let adapter: MockBLEAdapterNative;

  beforeEach(() => {
    adapter = createMockBLEAdapter();
  });

  afterEach(async () => {
    await adapter.destroy();
  });

  test('should do something', async () => {
    const options = createAdvertisingOptions();
    await adapter.startAdvertising(options);

    expect(adapter.isAdvertisingActive()).toBe(true);
  });
});
```

### Using Custom Matchers

```typescript
// Validate BLE state
expect(state).toBeValidBLEState();

// Validate Buffer
expect(data).toBeValidBuffer();

// Validate manufacturer data (at least 2 bytes)
expect(manufacturerData).toBeValidManufacturerData();
```

### Testing Async Operations

```typescript
// Wait for single event
const devicePromise = waitForEvent(adapter, 'deviceDiscovered');
await adapter.startScanning(options);
const device = await devicePromise;

// Wait for multiple events
const devicesPromise = waitForEvents(adapter, 'deviceDiscovered', 3);
await adapter.startScanning(options);
const devices = await devicesPromise;

// Wait for condition
await waitForCondition(() => adapter.isAdvertisingActive(), 5000);
```

### Using Test Utilities

```typescript
// Create manufacturer data
const data = createManufacturerData(0xFFFF, [0x01, 0x02, 0x03]);

// Create mock device
const device = createMockDevice({
  address: 'AA:BB:CC:DD:EE:FF',
  name: 'TestDevice',
  rssi: -60,
});

// Generate random identifiers
const mac = randomMacAddress(); // "AA:BB:CC:DD:EE:FF"
const uuid = randomUUID();       // "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"

// Create options with defaults
const advOptions = createAdvertisingOptions({ interval: 100 });
const scanOptions = createScanOptions({ filterByManufacturer: 0xFFFF });

// Async delay
await delay(100);

// Compare buffers
assertBufferEquals(actual, expected);
```

### Testing Error Conditions

```typescript
test('should reject invalid parameters', async () => {
  const invalidOptions = createAdvertisingOptions({ interval: 10 }); // Too low

  await expect(adapter.startAdvertising(invalidOptions))
    .rejects
    .toThrow('between 20ms and 10000ms');
});

test('should handle operation failures', async () => {
  adapter.shouldFailNextOperation = true;
  adapter.failureError = 'Hardware error';

  await expect(adapter.startAdvertising(options))
    .rejects
    .toThrow('Hardware error');
});
```

### Testing State Changes

```typescript
test('should handle state transitions', async () => {
  const stateChangePromise = waitForEvent(adapter, 'stateChange');

  adapter.simulateStateChange('poweredOff');

  const newState = await stateChangePromise;
  expect(newState).toBe('poweredOff');
});
```

## Mock Infrastructure

### MockBLEAdapterNative

The `MockBLEAdapterNative` class simulates all BLE hardware operations without requiring physical adapters.

#### Features

- **State Management**: Simulates BLE adapter states (poweredOn, poweredOff, etc.)
- **Advertising**: Full advertising lifecycle with validation
- **Scanning**: Device discovery with filtering
- **Event Emission**: All events that native implementation would emit
- **Test Controls**: Configurable delays, failures, and mock devices

#### Using the Mock

```typescript
import { createMockBLEAdapter } from '../mocks/ble-adapter.mock';

const adapter = createMockBLEAdapter();

// Configure behavior
adapter.simulatedDelay = 50; // ms delay for operations
adapter.shouldFailNextOperation = true; // Next operation will fail
adapter.failureError = 'Test error message';

// Add mock devices for discovery
adapter.addMockDevice(createMockDevice({
  address: 'AA:BB:CC:DD:EE:FF',
  name: 'TestDevice',
}));

// Simulate state changes
adapter.simulateStateChange('poweredOff');

// Simulate device discovery
adapter.simulateDeviceDiscovery(mockDevice);

// Check state
adapter.isAdvertisingActive(); // boolean
adapter.isScanningActive();    // boolean

// Cleanup
await adapter.destroy();
```

#### Mock Device Management

```typescript
// Add single device
adapter.addMockDevice(device);

// Add multiple devices
devices.forEach(d => adapter.addMockDevice(d));

// Clear all devices
adapter.clearMockDevices();
```

## Coverage Requirements

All code must meet the following minimum coverage thresholds:

| Metric     | Minimum | Target |
| ---------- | ------- | ------ |
| Branches   | 80%     | 90%    |
| Functions  | 80%     | 90%    |
| Lines      | 80%     | 90%    |
| Statements | 80%     | 90%    |

### Viewing Coverage

After running tests with `--coverage`, open the HTML report:

```bash
open coverage/lcov-report/index.html
```

The report shows:
- Overall coverage percentages
- Per-file coverage details
- Uncovered lines highlighted in red
- Partially covered branches in yellow

### Improving Coverage

To improve coverage:

1. **Identify uncovered code** in the coverage report
2. **Write tests** for uncovered branches and functions
3. **Test error paths** - these are often missed
4. **Test edge cases** - boundary conditions, empty inputs, etc.
5. **Test all state transitions** - powered on/off, advertising/scanning

## Continuous Integration

### CI Configuration

Tests run automatically on:
- Push to any branch
- Pull request creation/update
- Before merge to main branch

### CI Requirements

All of the following must pass:
- ✅ Unit tests
- ✅ Integration tests
- ✅ Performance tests
- ✅ Coverage thresholds (80%)
- ✅ TypeScript compilation
- ✅ Linting (ESLint)
- ✅ Formatting (Prettier)

### GitHub Actions Example

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Best Practices

### Do's ✅

- **Write tests first** (TDD approach)
- **Test one thing per test** - keep tests focused
- **Use descriptive test names** - "should start advertising with valid options"
- **Test error cases** - not just happy paths
- **Use custom matchers** for BLE-specific validations
- **Clean up resources** in `afterEach` hooks
- **Use test utilities** to reduce duplication
- **Test async code properly** with async/await
- **Mock external dependencies** (BLE hardware)

### Don'ts ❌

- **Don't test implementation details** - test behavior
- **Don't share state between tests** - each test should be independent
- **Don't skip cleanup** - always call `adapter.destroy()`
- **Don't hardcode timeouts** - use `waitForEvent` helpers
- **Don't ignore flaky tests** - fix them or remove them
- **Don't test multiple things** in one test
- **Don't use real hardware** in unit tests

## Troubleshooting

### Tests Timing Out

If tests are timing out:

1. Check that events are being emitted correctly
2. Verify async operations are awaited
3. Increase timeout for specific test: `test('name', async () => {...}, 15000)`
4. Use `--verbose` flag to see which test is hanging

### Coverage Not Meeting Threshold

If coverage is below 80%:

1. Run `npm test -- --coverage` to see report
2. Open `coverage/lcov-report/index.html` in browser
3. Look for red (uncovered) and yellow (partial) lines
4. Write tests to cover those paths

### Mock Not Behaving Correctly

If the mock isn't simulating correctly:

1. Check that `simulatedDelay` is set appropriately
2. Verify mock devices are added before scanning starts
3. Ensure state is 'poweredOn' for operations
4. Check that `shouldFailNextOperation` is reset after failures

### Tests Passing Locally But Failing in CI

Common causes:

1. **Timing issues** - CI environments may be slower
2. **Missing dependencies** - check `package.json`
3. **Environment differences** - Node.js version mismatch
4. **File paths** - use absolute paths or path.join()

## Future Enhancements

Planned testing improvements:

- [ ] Visual regression testing for error messages
- [ ] Property-based testing with fast-check
- [ ] Mutation testing to validate test quality
- [ ] Performance benchmarking dashboard
- [ ] Automated platform-specific testing
- [ ] Memory leak detection tests
- [ ] Stress testing with extended operations
- [ ] Cross-platform test matrix (macOS, Windows, Linux)

---

For questions or issues with testing, please open an issue in the repository.
