# Native BLE Module - System Design

**Project:** GhostMesh Native BLE
**Version:** 1.0.0
**Date:** January 24, 2026
**Status:** Draft

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    JavaScript Layer (Node.js)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           TypeScript/JavaScript API                   │   │
│  │    (BLEAdapter, EventEmitter, Promise-based)         │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│                            │ Node-API (N-API)                 │
│                            ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              C++ Binding Layer                        │   │
│  │  (addon.cc, ble_adapter.cc, callbacks, marshalling)  │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
│                            │ Platform Interface               │
│                            ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Platform Abstraction Layer (C++)             │   │
│  │           (IBLEPlatform interface)                    │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                  │                  │               │
│         ▼                  ▼                  ▼               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   macOS     │  │  Windows    │  │   Linux     │         │
│  │ Platform    │  │  Platform   │  │  Platform   │         │
│  │(Obj-C++)    │  │  (WinRT)    │  │  (BlueZ)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │     Operating System BLE Stack        │
        │  (CoreBluetooth / WinRT / BlueZ)      │
        └───────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │        BLE Hardware Adapter           │
        │    (Built-in or USB Bluetooth)        │
        └───────────────────────────────────────┘
```

### 1.2 Design Principles

1. **Platform Agnostic API**: Single JavaScript API works across all platforms
2. **Minimal Dependencies**: No external BLE libraries, use OS native APIs only
3. **Memory Safe**: RAII patterns, smart pointers, no manual memory management
4. **Thread Safe**: Proper synchronization for callbacks from OS threads
5. **Fail Fast**: Input validation at JavaScript layer, errors propagate clearly
6. **Zero Copy**: Direct buffer passing where possible

## 2. Component Design

### 2.1 JavaScript Layer

**File: `src/index.ts`**

```typescript
import { EventEmitter } from 'events';
import { BLEAdapterNative } from './binding';

export class BLEAdapter extends EventEmitter {
  private native: BLEAdapterNative;
  private state: BLEState;

  constructor() {
    super();
    this.native = new BLEAdapterNative();
    this.setupNativeCallbacks();
  }

  private setupNativeCallbacks(): void {
    this.native.onStateChange((state: BLEState) => {
      this.state = state;
      this.emit('stateChange', state);
    });

    this.native.onDeviceDiscovered((device: DiscoveredDevice) => {
      this.emit('deviceDiscovered', device);
    });
  }

  async getState(): Promise<BLEState> {
    return this.native.getState();
  }

  async startAdvertising(options: AdvertisingOptions): Promise<void> {
    this.validateAdvertisingOptions(options);
    return this.native.startAdvertising(options);
  }

  // ... more methods
}
```

**Responsibilities:**
- Input validation
- Type conversions
- Event emission
- Promise wrapping for async operations
- Error handling and translation

### 2.2 C++ Binding Layer

**File: `binding/addon.cc`**

```cpp
#include <napi.h>
#include "ble_adapter_wrapper.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  BLEAdapterWrapper::Init(env, exports);
  return exports;
}

NODE_API_MODULE(native_ble, InitAll)
```

**File: `binding/ble_adapter_wrapper.h`**

```cpp
#include <napi.h>
#include <memory>
#include "platform/ble_platform.h"

class BLEAdapterWrapper : public Napi::ObjectWrap<BLEAdapterWrapper> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  explicit BLEAdapterWrapper(const Napi::CallbackInfo& info);
  ~BLEAdapterWrapper();

private:
  // JavaScript-callable methods
  Napi::Value GetState(const Napi::CallbackInfo& info);
  Napi::Value StartAdvertising(const Napi::CallbackInfo& info);
  Napi::Value UpdateAdvertisingData(const Napi::CallbackInfo& info);
  Napi::Value StopAdvertising(const Napi::CallbackInfo& info);
  Napi::Value StartScanning(const Napi::CallbackInfo& info);
  Napi::Value StopScanning(const Napi::CallbackInfo& info);

  // Callback setters
  void OnStateChange(const Napi::CallbackInfo& info);
  void OnDeviceDiscovered(const Napi::CallbackInfo& info);

  // Internal callbacks from platform layer
  void HandleStateChange(BLEState state);
  void HandleDeviceDiscovered(const DiscoveredDevice& device);

  // Thread-safe function for callbacks
  Napi::ThreadSafeFunction tsfStateChange_;
  Napi::ThreadSafeFunction tsfDeviceDiscovered_;

  // Platform implementation
  std::unique_ptr<IBLEPlatform> platform_;
};
```

**Responsibilities:**
- Expose C++ to JavaScript via N-API
- Manage object lifetime
- Handle thread-safe callbacks from native threads
- Convert between JavaScript and C++ types
- Error translation

### 2.3 Platform Abstraction Layer

**File: `binding/platform/ble_platform.h`**

```cpp
#pragma once

#include <string>
#include <vector>
#include <functional>
#include <cstdint>

// BLE Adapter States
enum class BLEState {
  UNKNOWN = 0,
  RESETTING = 1,
  UNSUPPORTED = 2,
  UNAUTHORIZED = 3,
  POWERED_OFF = 4,
  POWERED_ON = 5
};

// Advertising options
struct AdvertisingOptions {
  std::string name;
  std::vector<std::string> serviceUUIDs;
  std::vector<uint8_t> manufacturerData;
  uint32_t intervalMs;
  int8_t txPowerLevel;
};

// Scan options
struct ScanOptions {
  uint16_t filterByManufacturer;  // 0 = no filter
  std::vector<std::string> filterByService;
  bool allowDuplicates;
  uint32_t duplicateTimeoutMs;
};

// Discovered device
struct DiscoveredDevice {
  std::string address;
  std::string name;
  int16_t rssi;
  std::vector<uint8_t> manufacturerData;
  std::vector<std::string> serviceUUIDs;
  uint64_t timestamp;
};

// Platform callbacks
using StateChangeCallback = std::function<void(BLEState)>;
using DeviceDiscoveredCallback = std::function<void(const DiscoveredDevice&)>;

// Platform interface - all platforms must implement this
class IBLEPlatform {
public:
  virtual ~IBLEPlatform() = default;

  // Initialization
  virtual void Initialize() = 0;
  virtual void Shutdown() = 0;

  // State management
  virtual BLEState GetState() const = 0;
  virtual void SetStateChangeCallback(StateChangeCallback callback) = 0;

  // Advertising
  virtual void StartAdvertising(const AdvertisingOptions& options) = 0;
  virtual void UpdateAdvertisingData(const std::vector<uint8_t>& data) = 0;
  virtual void StopAdvertising() = 0;

  // Scanning
  virtual void StartScanning(const ScanOptions& options) = 0;
  virtual void SetDeviceDiscoveredCallback(DeviceDiscoveredCallback callback) = 0;
  virtual void StopScanning() = 0;
};

// Factory function - implemented per platform
std::unique_ptr<IBLEPlatform> CreateBLEPlatform();
```

**Responsibilities:**
- Define platform-independent interface
- Provide data structures used across platforms
- Define callback signatures
- Factory pattern for platform creation

### 2.4 Platform Implementations

#### 2.4.1 macOS Platform

**File: `binding/platform/macos/ble_platform_macos.h`**

```cpp
#pragma once

#include "../ble_platform.h"
#include <memory>

class BLEPlatformMacOS : public IBLEPlatform {
public:
  BLEPlatformMacOS();
  ~BLEPlatformMacOS() override;

  void Initialize() override;
  void Shutdown() override;

  BLEState GetState() const override;
  void SetStateChangeCallback(StateChangeCallback callback) override;

  void StartAdvertising(const AdvertisingOptions& options) override;
  void UpdateAdvertisingData(const std::vector<uint8_t>& data) override;
  void StopAdvertising() override;

  void StartScanning(const ScanOptions& options) override;
  void SetDeviceDiscoveredCallback(DeviceDiscoveredCallback callback) override;
  void StopScanning() override;

private:
  class Impl;  // PIMPL pattern - hides Objective-C++
  std::unique_ptr<Impl> impl_;
};
```

**File: `binding/platform/macos/ble_platform_macos.mm`** (Objective-C++)

```objective-c++
#import <CoreBluetooth/CoreBluetooth.h>
#include "ble_platform_macos.h"

// Objective-C++ delegate
@interface BLEDelegate : NSObject <CBCentralManagerDelegate, CBPeripheralManagerDelegate>
@property (nonatomic, assign) BLEPlatformMacOS::Impl* impl;
@end

class BLEPlatformMacOS::Impl {
public:
  CBCentralManager* centralManager;
  CBPeripheralManager* peripheralManager;
  BLEDelegate* delegate;
  StateChangeCallback stateCallback;
  DeviceDiscoveredCallback deviceCallback;

  void Initialize() {
    delegate = [[BLEDelegate alloc] init];
    delegate.impl = this;

    dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0);
    centralManager = [[CBCentralManager alloc] initWithDelegate:delegate queue:queue];
    peripheralManager = [[CBPeripheralManager alloc] initWithDelegate:delegate queue:queue];
  }

  // ... implementation
};

@implementation BLEDelegate

- (void)peripheralManagerDidUpdateState:(CBPeripheralManager *)peripheral {
  if (self.impl && self.impl->stateCallback) {
    BLEState state = [self convertState:peripheral.state];
    self.impl->stateCallback(state);
  }
}

- (void)centralManager:(CBCentralManager *)central
 didDiscoverPeripheral:(CBPeripheral *)peripheral
     advertisementData:(NSDictionary<NSString *,id> *)advertisementData
                  RSSI:(NSNumber *)RSSI {
  if (self.impl && self.impl->deviceCallback) {
    DiscoveredDevice device;
    device.address = [[peripheral.identifier UUIDString] UTF8String];
    device.rssi = [RSSI shortValue];
    // Extract manufacturer data...
    self.impl->deviceCallback(device);
  }
}

// ... more delegate methods

@end
```

#### 2.4.2 Windows Platform

**File: `binding/platform/windows/ble_platform_windows.h`**

```cpp
#pragma once

#include "../ble_platform.h"
#include <memory>

class BLEPlatformWindows : public IBLEPlatform {
public:
  BLEPlatformWindows();
  ~BLEPlatformWindows() override;

  void Initialize() override;
  void Shutdown() override;

  BLEState GetState() const override;
  void SetStateChangeCallback(StateChangeCallback callback) override;

  void StartAdvertising(const AdvertisingOptions& options) override;
  void UpdateAdvertisingData(const std::vector<uint8_t>& data) override;
  void StopAdvertising() override;

  void StartScanning(const ScanOptions& options) override;
  void SetDeviceDiscoveredCallback(DeviceDiscoveredCallback callback) override;
  void StopScanning() override;

private:
  class Impl;
  std::unique_ptr<Impl> impl_;
};
```

**File: `binding/platform/windows/ble_platform_windows.cpp`** (WinRT C++/CX)

```cpp
#include "ble_platform_windows.h"
#include <winrt/Windows.Devices.Bluetooth.h>
#include <winrt/Windows.Devices.Bluetooth.Advertisement.h>

using namespace winrt::Windows::Devices::Bluetooth;
using namespace winrt::Windows::Devices::Bluetooth::Advertisement;

class BLEPlatformWindows::Impl {
public:
  BluetoothLEAdvertisementPublisher publisher{nullptr};
  BluetoothLEAdvertisementWatcher watcher{nullptr};

  StateChangeCallback stateCallback;
  DeviceDiscoveredCallback deviceCallback;

  void Initialize() {
    publisher = BluetoothLEAdvertisementPublisher();
    watcher = BluetoothLEAdvertisementWatcher();

    publisher.StatusChanged([this](auto&& sender, auto&& args) {
      HandlePublisherStatusChanged(args.Status());
    });

    watcher.Received([this](auto&& sender, auto&& args) {
      HandleAdvertisementReceived(args);
    });
  }

  void HandleAdvertisementReceived(
    BluetoothLEAdvertisementReceivedEventArgs const& args) {
    if (!deviceCallback) return;

    DiscoveredDevice device;
    device.rssi = args.RawSignalStrengthInDBm();
    device.timestamp = args.Timestamp().time_since_epoch().count();

    // Extract manufacturer data
    auto sections = args.Advertisement().ManufacturerData();
    // ... process data

    deviceCallback(device);
  }

  // ... more implementation
};
```

#### 2.4.3 Linux Platform

**File: `binding/platform/linux/ble_platform_linux.h`**

```cpp
#pragma once

#include "../ble_platform.h"
#include <memory>

class BLEPlatformLinux : public IBLEPlatform {
public:
  BLEPlatformLinux();
  ~BLEPlatformLinux() override;

  void Initialize() override;
  void Shutdown() override;

  BLEState GetState() const override;
  void SetStateChangeCallback(StateChangeCallback callback) override;

  void StartAdvertising(const AdvertisingOptions& options) override;
  void UpdateAdvertisingData(const std::vector<uint8_t>& data) override;
  void StopAdvertising() override;

  void StartScanning(const ScanOptions& options) override;
  void SetDeviceDiscoveredCallback(DeviceDiscoveredCallback callback) override;
  void StopScanning() override;

private:
  class Impl;
  std::unique_ptr<Impl> impl_;
};
```

**File: `binding/platform/linux/ble_platform_linux.cpp`** (BlueZ D-Bus)

```cpp
#include "ble_platform_linux.h"
#include <gio/gio.h>

class BLEPlatformLinux::Impl {
public:
  GDBusConnection* connection{nullptr};
  GDBusProxy* adapterProxy{nullptr};
  GDBusProxy* advertisingManagerProxy{nullptr};

  StateChangeCallback stateCallback;
  DeviceDiscoveredCallback deviceCallback;

  void Initialize() {
    GError* error = nullptr;
    connection = g_bus_get_sync(G_BUS_TYPE_SYSTEM, nullptr, &error);
    if (error) {
      // Handle error
      g_error_free(error);
      return;
    }

    // Get BlueZ adapter
    adapterProxy = g_dbus_proxy_new_sync(
      connection,
      G_DBUS_PROXY_FLAGS_NONE,
      nullptr,
      "org.bluez",
      "/org/bluez/hci0",
      "org.bluez.Adapter1",
      nullptr,
      &error
    );

    // Setup signal handlers
    g_signal_connect(adapterProxy, "g-properties-changed",
                     G_CALLBACK(OnPropertiesChanged), this);
  }

  static void OnPropertiesChanged(
    GDBusProxy* proxy,
    GVariant* changed_properties,
    GStrv invalidated_properties,
    gpointer user_data) {
    auto* impl = static_cast<Impl*>(user_data);
    // Handle property changes
    if (impl->stateCallback) {
      // Determine state from properties
      impl->stateCallback(/* ... */);
    }
  }

  // ... more implementation
};
```

### 2.5 Platform Factory

**File: `binding/platform/ble_platform_factory.cpp`**

```cpp
#include "ble_platform.h"

#ifdef __APPLE__
  #include "macos/ble_platform_macos.h"
  std::unique_ptr<IBLEPlatform> CreateBLEPlatform() {
    return std::make_unique<BLEPlatformMacOS>();
  }
#elif _WIN32
  #include "windows/ble_platform_windows.h"
  std::unique_ptr<IBLEPlatform> CreateBLEPlatform() {
    return std::make_unique<BLEPlatformWindows>();
  }
#elif __linux__
  #include "linux/ble_platform_linux.h"
  std::unique_ptr<IBLEPlatform> CreateBLEPlatform() {
    return std::make_unique<BLEPlatformLinux>();
  }
#else
  #error "Unsupported platform"
#endif
```

## 3. Data Flow

### 3.1 Advertising Flow

```
JavaScript                 C++ Binding              Platform Layer         OS API
─────────────────────────────────────────────────────────────────────────────────
startAdvertising(opts) ──>
                          ValidateOptions() ──>
                                               CreateAdvertisingData() ──>
                                                                        CBPeripheralManager
                                                                        .startAdvertising()
                          <── Promise resolves <── callback ──────────  delegate callback
emit('advertising')
```

### 3.2 Scanning Flow

```
JavaScript                 C++ Binding              Platform Layer         OS API
─────────────────────────────────────────────────────────────────────────────────
startScanning(opts) ───>
                          SetupScanFilter() ──>
                                               StartLEScan() ─────────> CBCentralManager
                          <── Promise resolves                          .scanForPeripherals()

                                              [OS detects device]
                                               <── callback ──────────  didDiscoverPeripheral
                          HandleDiscovered() <──
                          ThreadSafeCallback
emit('deviceDiscovered', device)
```

### 3.3 State Change Flow

```
OS API                    Platform Layer          C++ Binding             JavaScript
─────────────────────────────────────────────────────────────────────────────────
Bluetooth turned off ───>
                         OnStateChange() ──────>
                                                  ThreadSafeFunction() ──>
                                                                          emit('stateChange')
                                                                          .getState() = OFF
```

## 4. Memory Management

### 4.1 JavaScript Layer
- Managed by V8 garbage collector
- No manual memory management needed

### 4.2 C++ Layer
- **RAII Patterns**: All resources in RAII wrappers
- **Smart Pointers**: `std::unique_ptr`, `std::shared_ptr` for ownership
- **N-API Handles**: Automatic reference counting

```cpp
class BLEAdapterWrapper {
  std::unique_ptr<IBLEPlatform> platform_;  // Owned by wrapper
  Napi::ThreadSafeFunction tsfStateChange_; // Auto-released on destruct
};
```

### 4.3 Platform Layer
- **Platform Objects**: Owned by platform implementation
- **Callbacks**: Use weak references where needed
- **Buffers**: `std::vector<uint8_t>` for automatic cleanup

```cpp
class BLEPlatformMacOS::Impl {
  CBCentralManager* centralManager;  // ARC managed
  std::vector<uint8_t> advertisingData;  // RAII
};
```

## 5. Thread Safety

### 5.1 Threading Model

```
┌──────────────────────────────────────────────────────────────┐
│                      Main Thread (V8)                         │
│  - JavaScript execution                                       │
│  - N-API calls from JS                                        │
│  - Event emission                                             │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                      Worker Thread                            │
│  - N-API method execution                                     │
│  - Platform API calls                                         │
│  - Data marshalling                                           │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                   OS Callback Thread                          │
│  - CoreBluetooth callbacks (macOS)                            │
│  - WinRT event handlers (Windows)                             │
│  - D-Bus signals (Linux)                                      │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Thread-Safe Callbacks

```cpp
// Setup thread-safe function
tsfDeviceDiscovered_ = Napi::ThreadSafeFunction::New(
  env,
  callback,                    // JS callback
  "DeviceDiscovered",          // Name
  0,                          // Unlimited queue
  1,                          // Initial thread count
  [](Napi::Env, void*, void*) {}  // Finalizer
);

// Call from any thread
void HandleDeviceDiscovered(const DiscoveredDevice& device) {
  auto* deviceCopy = new DiscoveredDevice(device);

  tsfDeviceDiscovered_.BlockingCall(deviceCopy, [](Napi::Env env,
                                                    Napi::Function jsCallback,
                                                    DiscoveredDevice* device) {
    jsCallback.Call({ConvertDeviceToJS(env, *device)});
    delete device;
  });
}
```

## 6. Error Handling

### 6.1 Error Types

```typescript
enum BLEErrorCode {
  // Adapter errors
  ADAPTER_UNAVAILABLE = 'ADAPTER_UNAVAILABLE',
  ADAPTER_UNAUTHORIZED = 'ADAPTER_UNAUTHORIZED',
  ADAPTER_POWERED_OFF = 'ADAPTER_POWERED_OFF',

  // Advertising errors
  ADVERTISING_FAILED = 'ADVERTISING_FAILED',
  ADVERTISING_UNSUPPORTED = 'ADVERTISING_UNSUPPORTED',

  // Scanning errors
  SCANNING_FAILED = 'SCANNING_FAILED',

  // Data errors
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',

  // System errors
  PLATFORM_ERROR = 'PLATFORM_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

class BLEError extends Error {
  constructor(
    public code: BLEErrorCode,
    message: string,
    public nativeError?: any
  ) {
    super(message);
    this.name = 'BLEError';
  }
}
```

### 6.2 Error Propagation

```
Platform Layer           C++ Binding             JavaScript
────────────────────────────────────────────────────────────
throw std::runtime_error() ──>
                         catch & convert ──────>
                                                 reject(new BLEError())

                         or

callback with error ──────>
                         ThreadSafeFunction ──>
                                                 emit('error', BLEError)
```

## 7. Build System

### 7.1 binding.gyp

```python
{
  'targets': [
    {
      'target_name': 'native_ble',
      'sources': [
        'binding/addon.cc',
        'binding/ble_adapter_wrapper.cc',
        'binding/platform/ble_platform_factory.cpp'
      ],
      'include_dirs': [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      'dependencies': [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'conditions': [
        ['OS=="mac"', {
          'sources': [
            'binding/platform/macos/ble_platform_macos.mm'
          ],
          'xcode_settings': {
            'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
            'CLANG_CXX_LIBRARY': 'libc++',
            'MACOSX_DEPLOYMENT_TARGET': '10.15'
          },
          'link_settings': {
            'libraries': [
              '-framework CoreBluetooth',
              '-framework CoreFoundation'
            ]
          }
        }],
        ['OS=="win"', {
          'sources': [
            'binding/platform/windows/ble_platform_windows.cpp'
          ],
          'msvs_settings': {
            'VCCLCompilerTool': {
              'ExceptionHandling': 1,
              'AdditionalOptions': ['/await']
            }
          }
        }],
        ['OS=="linux"', {
          'sources': [
            'binding/platform/linux/ble_platform_linux.cpp'
          ],
          'libraries': [
            '<!@(pkg-config --libs gio-2.0)'
          ],
          'include_dirs': [
            '<!@(pkg-config --cflags-only-I gio-2.0 | sed s/-I//g)'
          ]
        }]
      ]
    }
  ]
}
```

## 8. Testing Strategy

### 8.1 Unit Tests (Jest + Native)
- JavaScript API validation
- Type conversions
- Error handling
- Memory leak detection

### 8.2 Integration Tests
- Advertising ↔ Scanning on same machine
- State change handling
- Error recovery

### 8.3 Platform Tests
- macOS specific tests
- Windows specific tests
- Linux specific tests

### 8.4 Hardware Tests
- Real BLE adapters
- Multiple devices
- Range testing
- Interference testing

## 9. Performance Targets

| Metric             | Target  | Measurement                              |
| ------------------ | ------- | ---------------------------------------- |
| Advertising Start  | < 200ms | Time from API call to first transmission |
| Advertising Update | < 100ms | Time to update active advertising        |
| Scan Discovery     | < 500ms | Time from transmission to callback       |
| Memory (Idle)      | < 5MB   | Resident memory                          |
| Memory (Active)    | < 10MB  | With scanning + advertising              |
| CPU (Idle)         | < 1%    | Background monitoring                    |
| CPU (Active)       | < 5%    | Active scanning                          |

## 10. Security Considerations

### 10.1 Input Validation
- All buffer sizes validated
- UTF-8 string validation
- UUID format validation
- Range checks on numeric parameters

### 10.2 Resource Limits
- Maximum 10 concurrent callbacks
- 1MB buffer size limit
- Timeout on blocking operations (5s)

### 10.3 Permissions
- macOS: NSBluetoothAlwaysUsageDescription required
- Windows: Bluetooth capability in manifest
- Linux: User must be in bluetooth group

## 11. Future Extensibility

### 11.1 Plugin Architecture
Design allows for additional platform backends:
- BSD variants
- Embedded Linux (custom BLE stacks)
- RTOS platforms

### 11.2 Feature Additions
- Multiple advertising sets
- Direction finding
- Periodic advertising
- BLE Audio (LE Audio)

## 12. Dependencies

### 12.1 Build Time
- Node.js 16+
- node-gyp
- Python 3.x
- Platform-specific toolchains

### 12.2 Runtime
- Node.js 16+
- OS BLE stack
- BLE 4.0+ hardware

### 12.3 Development
- TypeScript 5.x
- Jest for testing
- ESLint + Prettier
- Clang-format for C++

## 13. Deliverables

1. **Source Code**: Complete implementation
2. **Documentation**: API reference, examples
3. **Tests**: Unit + integration tests
4. **Prebuilt Binaries**: For common platforms
5. **npm Package**: Published and versioned
6. **CI/CD**: GitHub Actions for builds
