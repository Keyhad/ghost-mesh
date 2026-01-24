# Native BLE Module - Requirements Document

**Project:** GhostMesh Native BLE
**Version:** 1.0.0
**Date:** January 24, 2026
**Status:** Draft

## 1. Executive Summary

This document defines the requirements for a native Node.js BLE module that provides low-level Bluetooth Low Energy capabilities for the GhostMesh emergency communication system. The module must support connectionless advertising-based mesh networking without pairing requirements.

## 2. Project Goals

### Primary Goals

- **Connectionless Communication**: Enable BLE advertising and scanning without GATT connections
- **Maximum Payload**: Support up to 254 bytes per advertising packet (Extended Advertising)
- **Cross-Platform**: Support macOS, Windows, and Linux
- **No Pairing Required**: Work on locked/sleeping devices
- **Low Power**: Minimize battery consumption for mobile mesh nodes

### Secondary Goals

- **High Performance**: Sub-100ms advertising update latency
- **Reliability**: Handle BLE state changes gracefully
- **Developer-Friendly**: Simple TypeScript/JavaScript API
- **Testing**: Comprehensive test coverage for native code

## 3. Functional Requirements

### FR-1: BLE Advertising

**FR-1.1 Start Advertising**

- Module MUST support starting BLE advertising with custom manufacturer data
- Module MUST support advertising with 27-254 bytes of payload
- Module MUST support setting device name independently
- Module MUST support custom service UUIDs (16-bit and 128-bit)
- Module SHOULD support Extended Advertising (BLE 5.0+) where available

**FR-1.2 Update Advertising Data**

- Module MUST allow updating advertising data without stopping/restarting
- Update latency MUST be less than 100ms
- Module MUST queue updates if BLE adapter is busy

**FR-1.3 Stop Advertising**

- Module MUST support clean advertising shutdown
- Module MUST release all BLE resources on stop

**FR-1.4 Advertising Parameters**

- Module MUST support configurable advertising interval (100ms - 10s)
- Module MUST support advertising power level configuration (-20dBm to +4dBm)
- Module SHOULD support advertising channel selection (37, 38, 39)

### FR-2: BLE Scanning

**FR-2.1 Start Scanning**

- Module MUST support passive BLE scanning
- Module MUST detect devices with manufacturer data
- Module MUST extract manufacturer data from advertising packets
- Module MUST provide RSSI (signal strength) for discovered devices

**FR-2.2 Scan Filtering**

- Module MUST support filtering by manufacturer company ID
- Module SHOULD support filtering by service UUID
- Module SHOULD support duplicate filtering with configurable timeout

**FR-2.3 Stop Scanning**

- Module MUST support clean scan shutdown
- Module MUST stop all callbacks after scan stop

### FR-3: Platform Support

**FR-3.1 macOS**

- Module MUST use CoreBluetooth framework
- Module MUST support macOS 10.15+ (Catalina and later)
- Module MUST work on Intel and Apple Silicon
- Module MUST support Extended Advertising on macOS 11+

**FR-3.2 Windows**

- Module MUST use Windows BLE APIs (WinRT)
- Module MUST support Windows 10 1809+ (Bluetooth 5.0 support)
- Module MUST handle Windows permissions correctly
- Module SHOULD support Windows 11 enhanced BLE features

**FR-3.3 Linux**

- Module MUST use BlueZ D-Bus API
- Module MUST support BlueZ 5.50+
- Module SHOULD work without root privileges
- Module MUST handle systemd bluetooth service

### FR-4: API Design

**FR-4.1 JavaScript/TypeScript Interface**

```typescript
interface BLEAdapter {
  // Adapter state
  getState(): Promise<BLEState>;
  onStateChange(callback: (state: BLEState) => void): void;

  // Advertising
  startAdvertising(options: AdvertisingOptions): Promise<void>;
  updateAdvertisingData(data: Buffer): Promise<void>;
  stopAdvertising(): Promise<void>;

  // Scanning
  startScanning(options: ScanOptions): Promise<void>;
  onDeviceDiscovered(callback: (device: DiscoveredDevice) => void): void;
  stopScanning(): Promise<void>;

  // Cleanup
  destroy(): Promise<void>;
}

interface AdvertisingOptions {
  name?: string;
  serviceUUIDs?: string[];
  manufacturerData?: Buffer; // Company ID (2 bytes) + payload
  interval?: number; // milliseconds
  txPowerLevel?: number; // dBm
}

interface ScanOptions {
  filterByManufacturer?: number; // Company ID
  filterByService?: string[];
  allowDuplicates?: boolean;
  duplicateTimeout?: number; // milliseconds
}

interface DiscoveredDevice {
  address: string;
  name?: string;
  rssi: number;
  manufacturerData?: Buffer;
  serviceUUIDs?: string[];
  timestamp: number;
}

enum BLEState {
  UNKNOWN = 0,
  RESETTING = 1,
  UNSUPPORTED = 2,
  UNAUTHORIZED = 3,
  POWERED_OFF = 4,
  POWERED_ON = 5
}
```

**FR-4.2 Event System**

- Module MUST use EventEmitter pattern for callbacks
- Module MUST handle callback errors gracefully
- Module MUST support removing event listeners

**FR-4.3 Error Handling**

- Module MUST throw descriptive errors with error codes
- Module MUST never crash the Node.js process
- Module MUST provide platform-specific error details

### FR-5: Data Format

**FR-5.1 Manufacturer Data Format**

- First 2 bytes: Company ID (little-endian uint16)
- Remaining bytes: Custom payload (up to 252 bytes with Extended Advertising)
- Module MUST preserve byte order exactly as provided

**FR-5.2 Service UUID Format**

- Module MUST support 16-bit UUIDs (e.g., "1234")
- Module MUST support 128-bit UUIDs (e.g., "12345678-1234-1234-1234-123456789012")
- Module MUST handle UUID format conversion internally

## 4. Non-Functional Requirements

### NFR-1: Performance

- Advertising start latency: < 200ms
- Advertising update latency: < 100ms
- Scan discovery latency: < 500ms from physical transmission
- Memory usage: < 10MB for active scanning + advertising
- CPU usage: < 5% average on modern hardware

### NFR-2: Reliability

- Module MUST handle BLE adapter power off/on gracefully
- Module MUST recover from BLE errors without restart
- Module MUST support at least 100 advertising updates per minute
- Module MUST handle at least 1000 discovered devices without memory leak

### NFR-3: Security

- Module MUST NOT require elevated privileges (except where OS mandates)
- Module MUST NOT expose raw BLE adapter control
- Module MUST validate all input parameters
- Module MUST prevent buffer overflows in native code

### NFR-4: Compatibility

- Node.js versions: 16.x, 18.x, 20.x, 22.x
- Build system: node-gyp with prebuilt binaries
- Module MUST be installable via npm
- Module SHOULD provide prebuilt binaries for common platforms

### NFR-5: Maintainability

- Code coverage: > 80% for JavaScript, > 60% for native code
- Documentation: Complete API reference + examples
- Build time: < 2 minutes on modern hardware
- Clear separation between platform-specific and common code

### NFR-6: Developer Experience

- TypeScript types included
- ESM and CommonJS support
- Clear error messages
- Example code for common use cases
- Debugging support with environment variables

## 5. Constraints

### Technical Constraints

- **BLE Hardware Required**: Module requires BLE 4.0+ adapter
- **OS Restrictions**: Subject to OS-level BLE permissions and limitations
- **Extended Advertising**: Only available on BLE 5.0+ hardware
- **Background Mode**: Mobile devices may restrict background BLE
- **Power Management**: Some OSes may throttle BLE when on battery

### Platform-Specific Constraints

**macOS:**

- Must run as signed application for production
- Cannot advertise while screen is locked (OS limitation)
- CoreBluetooth requires NSBluetoothAlwaysUsageDescription in Info.plist

**Windows:**

- Requires Windows 10 1809+ for BLE 5.0 Extended Advertising
- May require administrator rights to modify BLE settings
- UWP sandbox restrictions may apply

**Linux:**

- Requires BlueZ 5.50+ for Extended Advertising
- May need user in `bluetooth` group
- D-Bus permissions required

## 6. Dependencies

### Build Dependencies

- **node-gyp**: Native addon build tool
- **node-addon-api**: C++ Node.js addon API
- **cmake-js** (alternative): CMake-based build system

### Platform Dependencies

**macOS:**
- Xcode Command Line Tools
- CoreBluetooth.framework
- CoreFoundation.framework

**Windows:**
- Visual Studio 2019+ with C++ tools
- Windows SDK 10.0.18362+
- WinRT C++ headers

**Linux:**
- GCC 8+ or Clang 10+
- BlueZ development headers (libbluetooth-dev)
- D-Bus development headers (libdbus-1-dev)
- pkg-config

### Runtime Dependencies
- Node.js 16+
- System BLE adapter (built-in or USB dongle)
- Platform-specific BLE stack

## 7. Success Criteria

### Milestone 1: Core Functionality (Week 1-2)
- ✅ Basic advertising on macOS
- ✅ Basic scanning on macOS
- ✅ Manufacturer data transmission verified
- ✅ TypeScript API defined

### Milestone 2: Cross-Platform (Week 3-4)
- ✅ Windows support implemented
- ✅ Linux support implemented
- ✅ Platform abstraction layer complete
- ✅ All platforms tested

### Milestone 3: Production Ready (Week 5-6)
- ✅ Extended Advertising support
- ✅ Prebuilt binaries
- ✅ Documentation complete
- ✅ Test coverage > 80%
- ✅ Published to npm

### Final Acceptance Criteria
- Module successfully transmits 254-byte payloads on all platforms
- GhostMesh integration working end-to-end
- No memory leaks after 24-hour stress test
- Installation success rate > 95% on supported platforms

## 8. Out of Scope

The following are explicitly NOT included in v1.0:

- ❌ GATT server/client functionality
- ❌ BLE pairing/bonding
- ❌ BLE connections (central/peripheral roles with connections)
- ❌ Bluetooth Classic support
- ❌ iOS/Android native support (mobile platforms use different APIs)
- ❌ Web Bluetooth API compatibility
- ❌ BLE mesh networking protocol (that's GhostMesh's responsibility)
- ❌ Encryption/security (application layer responsibility)

## 9. Future Enhancements (v2.0+)

- Direction finding (AoA/AoD) support
- BLE 5.1/5.2 features (isochronous channels, etc.)
- Power consumption monitoring
- Advanced scan filtering (pattern matching)
- Multiple simultaneous advertising sets
- BLE mesh provisioning hooks

## 10. References

- [Bluetooth Core Specification 5.4](https://www.bluetooth.com/specifications/specs/)
- [Apple CoreBluetooth Documentation](https://developer.apple.com/documentation/corebluetooth)
- [Windows BLE Documentation](https://docs.microsoft.com/en-us/windows/uwp/devices-sensors/bluetooth)
- [BlueZ D-Bus API](https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc)
- [Node-API Documentation](https://nodejs.org/api/n-api.html)
