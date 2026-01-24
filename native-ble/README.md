# GhostMesh Native BLE Module

A cross-platform native Node.js addon for Bluetooth Low Energy (BLE) with Extended Advertising support. No pairing required - perfect for mesh networking.

## 🚀 Features

- **Connectionless BLE**: Advertising and scanning without GATT connections
- **Extended Advertising**: Up to 254 bytes per packet (BLE 5.0+)
- **Cross-Platform**: macOS, Windows 10+, Linux
- **No Pairing**: Works on locked devices
- **TypeScript**: Full type definitions included
- **High Performance**: Sub-100ms advertising updates
- **Native Code**: Direct OS API access for maximum control
- **Mobile Ready**: Architecture supports iOS/Android (see [MOBILE_SUPPORT.md](docs/MOBILE_SUPPORT.md))

## 📦 Installation

```bash
npm install @ghostmesh/native-ble
```

### Prerequisites

**macOS:**
- macOS 10.15+ (Catalina or later)
- Xcode Command Line Tools

**Windows:**
- Windows 10 1809+ or Windows 11
- Visual Studio 2019+ with C++ build tools
- Windows SDK 10.0.18362+

**Linux:**
- BlueZ 5.50+
- Development packages:
  ```bash
  sudo apt-get install libbluetooth-dev libdbus-1-dev pkg-config
  ```

## 📖 Usage

### Basic Advertising

```typescript
import { BLEAdapter } from '@ghostmesh/native-ble';

const ble = new BLEAdapter();

// Wait for adapter to be ready
ble.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    startAdvertising();
  }
});

async function startAdvertising() {
  // Create manufacturer data (Company ID 0xFFFF + payload)
  const companyId = Buffer.from([0xFF, 0xFF]); // 0xFFFF
  const payload = Buffer.from([0x01, 0x02, 0x03, 0x04]);
  const manufacturerData = Buffer.concat([companyId, payload]);

  await ble.startAdvertising({
    name: 'MyDevice',
    serviceUUIDs: ['1234'],
    manufacturerData: manufacturerData,
    interval: 100, // ms
    txPowerLevel: 0 // dBm
  });

  console.log('Advertising started!');
}
```

### Scanning for Devices

```typescript
import { BLEAdapter } from '@ghostmesh/native-ble';

const ble = new BLEAdapter();

ble.on('deviceDiscovered', (device) => {
  console.log('Found device:', {
    address: device.address,
    name: device.name,
    rssi: device.rssi,
    manufacturerData: device.manufacturerData?.toString('hex')
  });
});

ble.on('stateChange', async (state) => {
  if (state === 'poweredOn') {
    await ble.startScanning({
      filterByManufacturer: 0xFFFF, // Only devices with this company ID
      allowDuplicates: false,
      duplicateTimeout: 1000
    });
    console.log('Scanning started!');
  }
});
```

### Update Advertising Data

```typescript
// Update manufacturer data without stopping advertising
const newData = Buffer.concat([
  Buffer.from([0xFF, 0xFF]), // Company ID
  Buffer.from([0x05, 0x06, 0x07, 0x08]) // New payload
]);

await ble.updateAdvertisingData(newData);
```

## 📚 API Reference

### BLEAdapter

#### Constructor
```typescript
new BLEAdapter(): BLEAdapter
```

#### Methods

##### `getState(): Promise<BLEState>`
Get current adapter state.

**Returns:** One of: `'unknown'`, `'resetting'`, `'unsupported'`, `'unauthorized'`, `'poweredOff'`, `'poweredOn'`

##### `startAdvertising(options: AdvertisingOptions): Promise<void>`
Start BLE advertising.

**Options:**
- `name?: string` - Device name
- `serviceUUIDs?: string[]` - Service UUIDs to advertise
- `manufacturerData?: Buffer` - Manufacturer data (2-byte company ID + payload)
- `interval?: number` - Advertising interval in ms (default: 100)
- `txPowerLevel?: number` - TX power in dBm (default: 0)

##### `updateAdvertisingData(data: Buffer): Promise<void>`
Update manufacturer data while advertising.

**Parameters:**
- `data: Buffer` - New manufacturer data (company ID + payload)

##### `stopAdvertising(): Promise<void>`
Stop advertising.

##### `startScanning(options: ScanOptions): Promise<void>`
Start scanning for devices.

**Options:**
- `filterByManufacturer?: number` - Filter by company ID (0 = no filter)
- `filterByService?: string[]` - Filter by service UUIDs
- `allowDuplicates?: boolean` - Report same device multiple times (default: false)
- `duplicateTimeout?: number` - Duplicate filter timeout in ms (default: 1000)

##### `stopScanning(): Promise<void>`
Stop scanning.

##### `destroy(): Promise<void>`
Clean up and release resources.

#### Events

##### `stateChange`
Emitted when adapter state changes.

```typescript
ble.on('stateChange', (state: BLEState) => {
  console.log('State:', state);
});
```

##### `deviceDiscovered`
Emitted when a device is discovered during scanning.

```typescript
ble.on('deviceDiscovered', (device: DiscoveredDevice) => {
  console.log('Device:', device);
});
```

##### `error`
Emitted when an error occurs.

```typescript
ble.on('error', (error: BLEError) => {
  console.error('BLE Error:', error.code, error.message);
});
```

### Types

```typescript
interface AdvertisingOptions {
  name?: string;
  serviceUUIDs?: string[];
  manufacturerData?: Buffer;
  interval?: number;
  txPowerLevel?: number;
}

interface ScanOptions {
  filterByManufacturer?: number;
  filterByService?: string[];
  allowDuplicates?: boolean;
  duplicateTimeout?: number;
}

interface DiscoveredDevice {
  address: string;
  name?: string;
  rssi: number;
  manufacturerData?: Buffer;
  serviceUUIDs?: string[];
  timestamp: number;
}

type BLEState = 'unknown' | 'resetting' | 'unsupported' | 'unauthorized' | 'poweredOff' | 'poweredOn';

class BLEError extends Error {
  code: BLEErrorCode;
  nativeError?: any;
}
```

## 🔧 Development

### Build from Source

```bash
# Clone repository
git clone https://github.com/ghostmesh/native-ble.git
cd native-ble

# Install dependencies
npm install

# Build native addon and TypeScript
npm run build

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test suite
npm test -- test/unit
```

### Testing

Comprehensive test suite with 80% minimum coverage requirement. See [test/README.md](test/README.md) for detailed testing documentation.

**Test Suites:**
- **Unit Tests**: Individual component testing with mocks
- **Integration Tests**: End-to-end advertising and scanning
- **Performance Tests**: Validates timing requirements (<200ms start, <100ms update)

**Features:**
- Mock BLE hardware for testing without physical adapters
- Custom Jest matchers for BLE-specific assertions
- Test utilities for common patterns (events, delays, data creation)
- Automated coverage reporting

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test -- test/unit/adapter.test.ts
```

### Project Structure

```
native-ble/
├── binding/              # Native C++ code
│   ├── addon.cc         # N-API entry point
│   ├── ble_adapter_wrapper.cc/h
│   └── platform/        # Platform-specific implementations
│       ├── ble_platform.h
│       ├── macos/
│       ├── windows/
│       └── linux/
├── src/                 # TypeScript source
│   ├── index.ts
│   └── types.ts
├── test/                # Tests
├── docs/                # Documentation
│   ├── REQUIREMENTS.md
│   └── SYSTEM_DESIGN.md
├── binding.gyp          # Native build configuration
├── package.json
└── tsconfig.json
```

## 🐛 Troubleshooting

### macOS

**"Bluetooth permission denied"**
- Add `NSBluetoothAlwaysUsageDescription` to your app's Info.plist
- Grant Bluetooth permissions in System Preferences

**"Cannot find CoreBluetooth framework"**
- Install Xcode Command Line Tools: `xcode-select --install`

### Windows

**"Cannot find Windows SDK"**
- Install Visual Studio with C++ development tools
- Install Windows SDK 10.0.18362 or later

### Linux

**"Cannot connect to BlueZ"**
- Ensure BlueZ is running: `sudo systemctl start bluetooth`
- Add user to bluetooth group: `sudo usermod -a -G bluetooth $USER`

**"Permission denied"**
- Run with proper D-Bus permissions
- Check `/etc/dbus-1/system.d/bluetooth.conf`

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please see CONTRIBUTING.md for guidelines.

## 🔗 Links

- [Documentation](https://github.com/ghostmesh/native-ble/tree/main/docs)
  - [Requirements](docs/REQUIREMENTS.md)
  - [System Design](docs/SYSTEM_DESIGN.md)
  - [Mobile Support Strategy](docs/MOBILE_SUPPORT.md)
- [Issues](https://github.com/ghostmesh/native-ble/issues)
- [GhostMesh Project](https://github.com/ghostmesh/ghost-mesh)

## 📱 Mobile Platforms

This package targets **desktop platforms** (macOS, Windows, Linux) with Node.js.

For **iOS and Android** support via React Native, see [MOBILE_SUPPORT.md](docs/MOBILE_SUPPORT.md) for the architecture and implementation strategy. The core C++ platform abstraction is designed to be reusable across mobile platforms.
