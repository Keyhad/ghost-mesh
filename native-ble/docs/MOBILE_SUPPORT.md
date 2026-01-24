# Mobile Platform Support Strategy

**Project:** GhostMesh Native BLE
**Version:** 1.0.0
**Date:** January 24, 2026
**Status:** Planning

## 1. Overview

This document outlines the strategy for extending the native BLE module to support iOS and Android platforms. While the desktop module uses Node.js N-API, mobile platforms require different binding mechanisms.

## 2. Why Mobile is Different

### 2.1 Runtime Environment

**Desktop (Node.js):**
- Node.js runtime with V8 engine
- N-API for native bindings
- npm package distribution
- Full OS access

**Mobile:**
- Native mobile app runtime (iOS/Android)
- Different binding mechanisms (React Native, Flutter, etc.)
- App store distribution
- Sandboxed environment with restricted background execution

### 2.2 BLE APIs

**iOS:**
- CoreBluetooth framework (same as macOS)
- Background modes limited by iOS
- App must be running or in specific background modes
- Cannot advertise while screen locked (OS limitation)

**Android:**
- Android Bluetooth API (Java/Kotlin)
- Background execution restrictions (Android 8+)
- Runtime permissions required
- Can advertise in background with limitations

## 3. Architecture Strategy

### 3.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  Desktop: Node.js/Electron  │  Mobile: React Native/Flutter  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Binding Layer                             │
│  Desktop: N-API             │  Mobile: RN Bridge/Channels   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Shared C++ Platform Abstraction                 │
│                   (IBLEPlatform)                             │
│  - Platform-independent interface                            │
│  - Shared data structures                                    │
│  - Common utilities                                          │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Desktop    │  │     iOS      │  │   Android    │
│ Platforms    │  │  Platform    │  │   Platform   │
│(Mac/Win/Lin) │  │(Obj-C++/C++) │  │  (JNI/C++)   │
└──────────────┘  └──────────────┘  └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   OS BLE     │  │ CoreBluetooth│  │ Android BLE  │
│    Stack     │  │  Framework   │  │     API      │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 3.2 Code Reuse

**What CAN be shared:**
- ✅ Platform abstraction interface (`IBLEPlatform`)
- ✅ Data structures (`AdvertisingOptions`, `DiscoveredDevice`, etc.)
- ✅ iOS CoreBluetooth implementation (90% shared with macOS)
- ✅ Utility functions (UUID parsing, data conversion)
- ✅ Business logic

**What CANNOT be shared:**
- ❌ N-API binding layer (desktop only)
- ❌ React Native bridge (mobile only)
- ❌ Android Java/Kotlin wrapper
- ❌ Build configuration (node-gyp vs Xcode/Gradle)

## 4. Mobile Platform Implementations

### 4.1 iOS (React Native Example)

**Architecture:**
```
JavaScript (React Native)
          │
          ▼
React Native Bridge
          │
          ▼
Objective-C++ Module
          │
          ▼
BLEPlatformIOS (C++)
          │
          ▼
CoreBluetooth
```

**Project Structure:**
```
native-ble-mobile/
├── ios/
│   ├── GhostMeshBLE.h           # RN module header
│   ├── GhostMeshBLE.mm          # RN bridge implementation
│   ├── BLEPlatformIOS.h         # iOS platform header
│   ├── BLEPlatformIOS.mm        # iOS implementation (C++/Obj-C++)
│   └── GhostMeshBLE.podspec     # CocoaPods spec
├── android/
│   └── ...
├── src/
│   └── index.ts                 # TypeScript API
└── package.json
```

**Key Differences from Desktop:**

1. **Background Execution:**
```objective-c++
// iOS requires declaring background modes in Info.plist
// <key>UIBackgroundModes</key>
// <array>
//   <string>bluetooth-central</string>
//   <string>bluetooth-peripheral</string>
// </array>

// Advertising in background is limited:
- Device name not visible
- Only service UUIDs advertised
- Manufacturer data may be truncated
- iOS decides when to advertise
```

2. **State Restoration:**
```objective-c++
// iOS can restore BLE state after app termination
CBPeripheralManager* peripheralManager = [[CBPeripheralManager alloc]
  initWithDelegate:delegate
  queue:nil
  options:@{
    CBPeripheralManagerOptionRestoreIdentifierKey: @"ghostmesh-peripheral"
  }];
```

3. **Permission Handling:**
```objective-c++
// iOS 13+ requires explicit permission
// Info.plist:
// <key>NSBluetoothAlwaysUsageDescription</key>
// <string>GhostMesh needs Bluetooth for emergency mesh networking</string>
```

### 4.2 Android (React Native Example)

**Architecture:**
```
JavaScript (React Native)
          │
          ▼
React Native Bridge
          │
          ▼
Kotlin/Java Module
          │
          ▼
JNI Bridge (optional)
          │
          ▼
BLEPlatformAndroid (C++)
          │
          ▼
Android Bluetooth API
```

**Project Structure:**
```
native-ble-mobile/
├── android/
│   ├── src/main/
│   │   ├── java/com/ghostmesh/ble/
│   │   │   ├── GhostMeshBLEModule.kt      # RN module
│   │   │   ├── BLEAdvertiser.kt           # Advertising wrapper
│   │   │   └── BLEScanner.kt              # Scanning wrapper
│   │   └── cpp/                           # Optional JNI
│   │       ├── ble_platform_android.h
│   │       └── ble_platform_android.cpp
│   └── build.gradle
└── ...
```

**Key Differences from Desktop:**

1. **Runtime Permissions:**
```kotlin
// Android 12+ requires explicit permissions
val permissions = arrayOf(
    Manifest.permission.BLUETOOTH_ADVERTISE,
    Manifest.permission.BLUETOOTH_SCAN,
    Manifest.permission.BLUETOOTH_CONNECT,
    Manifest.permission.ACCESS_FINE_LOCATION
)
```

2. **Background Execution:**
```kotlin
// Android 8+ requires foreground service for background BLE
val notification = NotificationCompat.Builder(context, CHANNEL_ID)
    .setContentTitle("GhostMesh Active")
    .setContentText("Emergency mesh network running")
    .setSmallIcon(R.drawable.ic_mesh)
    .build()

startForeground(NOTIFICATION_ID, notification)
```

3. **Advertising Implementation:**
```kotlin
val advertiser = BluetoothAdapter.getDefaultAdapter().bluetoothLeAdvertiser

val settings = AdvertiseSettings.Builder()
    .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
    .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
    .setConnectable(false)
    .build()

val data = AdvertiseData.Builder()
    .setIncludeDeviceName(false)
    .addManufacturerData(0xFFFF, manufacturerData)
    .build()

advertiser.startAdvertising(settings, data, advertiseCallback)
```

## 5. Shared Platform Abstraction

The core `IBLEPlatform` interface remains the same across all platforms:

```cpp
// platform/ble_platform.h (SHARED)
class IBLEPlatform {
public:
  virtual void Initialize() = 0;
  virtual void StartAdvertising(const AdvertisingOptions& options) = 0;
  virtual void StartScanning(const ScanOptions& options) = 0;
  // ... same interface for all platforms
};
```

**Platform Implementations:**
- `BLEPlatformMacOS` - Desktop macOS (existing)
- `BLEPlatformIOS` - Mobile iOS (95% code reuse from macOS)
- `BLEPlatformAndroid` - Android (new implementation)
- `BLEPlatformWindows` - Desktop Windows (existing)
- `BLEPlatformLinux` - Desktop Linux (existing)

## 6. React Native Module Example

### 6.1 TypeScript API (Mobile)

```typescript
// Same API as desktop, but with mobile-specific options
import { BLEAdapter } from '@ghostmesh/native-ble-mobile';

const ble = new BLEAdapter();

// Mobile-specific options
await ble.startAdvertising({
  name: 'GhostMesh',
  manufacturerData: Buffer.from([0xFF, 0xFF, 0x01, 0x02]),

  // iOS-specific
  allowBackgroundAdvertising: true,
  restoreIdentifier: 'ghostmesh-peripheral',

  // Android-specific
  foregroundServiceNotification: {
    title: 'GhostMesh Active',
    message: 'Emergency mesh running'
  }
});
```

### 6.2 iOS Bridge Implementation

```objective-c++
// ios/GhostMeshBLE.mm
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "BLEPlatformIOS.h"

@interface GhostMeshBLE : RCTEventEmitter <RCTBridgeModule>
@property (nonatomic, strong) BLEPlatformIOS* platform;
@end

@implementation GhostMeshBLE

RCT_EXPORT_MODULE();

- (instancetype)init {
  if (self = [super init]) {
    _platform = [[BLEPlatformIOS alloc] init];
    [_platform setStateChangeCallback:^(BLEState state) {
      [self sendEventWithName:@"stateChange" body:@{@"state": @(state)}];
    }];
  }
  return self;
}

RCT_EXPORT_METHOD(startAdvertising:(NSDictionary*)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  AdvertisingOptions opts;
  opts.name = [options[@"name"] UTF8String];
  // ... convert options

  [_platform startAdvertising:opts callback:^(NSError* error) {
    if (error) {
      reject(@"ADVERTISING_FAILED", error.localizedDescription, error);
    } else {
      resolve(nil);
    }
  }];
}

@end
```

### 6.3 Android Bridge Implementation

```kotlin
// android/src/main/java/com/ghostmesh/ble/GhostMeshBLEModule.kt
class GhostMeshBLEModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val platform = BLEPlatformAndroid(reactContext)

    override fun getName() = "GhostMeshBLE"

    @ReactMethod
    fun startAdvertising(options: ReadableMap, promise: Promise) {
        try {
            val opts = AdvertisingOptions(
                name = options.getString("name"),
                manufacturerData = options.getArray("manufacturerData")?.toByteArray()
                // ... convert options
            )

            platform.startAdvertising(opts) { error ->
                if (error != null) {
                    promise.reject("ADVERTISING_FAILED", error.message)
                } else {
                    promise.resolve(null)
                }
            }
        } catch (e: Exception) {
            promise.reject("INVALID_PARAMETERS", e.message)
        }
    }
}
```

## 7. Implementation Roadmap

### Phase 1: Desktop (Current) - Weeks 1-6
- ✅ Requirements and design
- ⏳ macOS implementation
- ⏳ Windows implementation
- ⏳ Linux implementation
- ⏳ npm package

### Phase 2: iOS - Weeks 7-10
- Extract shared C++ code
- Implement React Native iOS bridge
- Port macOS implementation to iOS
- Handle iOS-specific limitations
- Test on real devices

### Phase 3: Android - Weeks 11-14
- Implement React Native Android bridge
- Create Android platform implementation
- Handle Android background restrictions
- Test on multiple Android versions

### Phase 4: Cross-Platform Testing - Weeks 15-16
- Test desktop ↔ mobile mesh
- Test iOS ↔ Android mesh
- Performance benchmarking
- Battery consumption testing

## 8. Mobile-Specific Challenges

### 8.1 Background Execution

**iOS:**
- ⚠️ Cannot advertise with device name in background
- ⚠️ Manufacturer data may be truncated
- ⚠️ iOS decides advertising frequency
- ✅ Can scan in background with service UUID filter

**Android:**
- ⚠️ Requires foreground service (user-visible notification)
- ⚠️ Background execution limits (Android 8+)
- ⚠️ Doze mode suspends BLE
- ✅ Can advertise with full data in foreground service

### 8.2 Permissions

**iOS:**
- Info.plist entries required
- No runtime permission prompt
- Bluetooth permission dialog shown automatically

**Android:**
- Runtime permission requests required
- Location permission needed for scanning (Android 9+)
- User can revoke permissions anytime

### 8.3 Battery Consumption

**iOS:**
- System manages power automatically
- Cannot set exact advertising interval
- More aggressive in background

**Android:**
- Can set advertising mode (low power vs low latency)
- More control but more responsibility
- Battery optimization can kill service

## 9. Testing Strategy

### 9.1 Cross-Platform Matrix

| From/To | macOS | Windows | Linux | iOS | Android |
| ------- | ----- | ------- | ----- | --- | ------- |
| macOS   | ✅     | ✅       | ✅     | ✅   | ✅       |
| Windows | ✅     | ✅       | ✅     | ✅   | ✅       |
| Linux   | ✅     | ✅       | ✅     | ✅   | ✅       |
| iOS     | ✅     | ✅       | ✅     | ✅   | ✅       |
| Android | ✅     | ✅       | ✅     | ✅   | ✅       |

### 9.2 Test Scenarios

1. **Advertising Discovery**: Each platform advertises, all others discover
2. **Manufacturer Data**: 27-byte and 254-byte payloads
3. **Background Mode**: Lock screen, background app
4. **State Changes**: Bluetooth off/on, airplane mode
5. **Battery Impact**: 24-hour continuous operation
6. **Range Testing**: Various distances and obstacles

## 10. Recommended Approach

### Option 1: Separate Packages (Recommended)

```
@ghostmesh/native-ble          - Desktop (Node.js)
@ghostmesh/native-ble-mobile   - Mobile (React Native)
```

**Advantages:**
- Clean separation of concerns
- Different dependencies
- Independent versioning
- Easier maintenance

**Shared:**
- Common C++ platform code in separate repo/submodule
- Common TypeScript type definitions
- Common documentation

### Option 2: Monorepo

```
native-ble/
├── packages/
│   ├── desktop/     - N-API bindings
│   ├── mobile/      - RN bindings
│   └── shared/      - C++ platform code
```

**Advantages:**
- Easier to keep in sync
- Shared CI/CD
- Single issue tracker

**Disadvantages:**
- More complex build
- Larger repository
- Mixed concerns

## 11. Flutter Alternative

For Flutter apps, create platform channels:

```dart
// Dart side
class GhostMeshBLE {
  static const platform = MethodChannel('com.ghostmesh.ble');

  Future<void> startAdvertising(Map<String, dynamic> options) async {
    await platform.invokeMethod('startAdvertising', options);
  }
}
```

The iOS/Android native implementations remain the same, just different binding layer.

## 12. Cordova/Capacitor Alternative

For Ionic/Cordova apps, create a plugin:

```typescript
// plugin.xml
<plugin id="cordova-plugin-ghostmesh-ble" version="1.0.0">
  <platform name="ios">
    <source-file src="src/ios/GhostMeshBLE.mm" />
  </platform>
  <platform name="android">
    <source-file src="src/android/GhostMeshBLE.kt" />
  </platform>
</plugin>
```

## 13. Summary

**Can we port to iOS/Android?**

**YES**, with this strategy:

1. ✅ **Shared Core**: Reuse C++ platform abstraction (`IBLEPlatform`)
2. ✅ **iOS Implementation**: 95% code reuse from macOS CoreBluetooth
3. ✅ **Android Implementation**: New, but follows same interface
4. ✅ **Different Bindings**: React Native bridge instead of N-API
5. ⚠️ **Mobile Limitations**: Background execution, permissions, battery
6. 📦 **Separate Package**: `@ghostmesh/native-ble-mobile` for React Native

The architecture is designed to support this extension. The key is separating the platform abstraction (which is portable) from the binding layer (which is platform-specific).

**Recommendation:** Complete desktop implementation first, then extract shared C++ code and create mobile package in Phase 2.
