# Native BLE Module - Function Test Plan

## Overview
This document outlines all function tests needed for the native BLE module, organized by component and priority.

## Test Categories

### 1. Core API Functions (TypeScript Layer)

#### BLEAdapter Class - State Management
- [x] `getState()` - Returns current adapter state
- [x] `getState()` - Reflects state changes
- [x] `getState()` - Handles all valid states (unknown, resetting, unsupported, unauthorized, poweredOff, poweredOn)
- [ ] `getState()` - Handles native adapter errors gracefully
- [ ] `getState()` - Updates internal state cache

#### BLEAdapter Class - Advertising Functions
- [x] `startAdvertising(options)` - Starts with valid options
- [x] `startAdvertising(options)` - Validates interval range (20-10000ms)
- [x] `startAdvertising(options)` - Validates manufacturer data is Buffer
- [x] `startAdvertising(options)` - Validates manufacturer data length (2-27 bytes)
- [x] `startAdvertising(options)` - Validates serviceUUIDs is array
- [x] `startAdvertising(options)` - Rejects when already advertising
- [x] `startAdvertising(options)` - Rejects when powered off
- [ ] `startAdvertising(options)` - Handles missing optional parameters
- [ ] `startAdvertising(options)` - Validates txPowerLevel range
- [ ] `startAdvertising(options)` - Handles extremely long device names
- [ ] `startAdvertising(options)` - Handles empty serviceUUIDs array
- [ ] `startAdvertising(options)` - Validates service UUID format

- [x] `updateAdvertisingData(data)` - Updates with valid data
- [x] `updateAdvertisingData(data)` - Validates data is Buffer
- [x] `updateAdvertisingData(data)` - Validates minimum length (2 bytes)
- [x] `updateAdvertisingData(data)` - Rejects when not advertising
- [ ] `updateAdvertisingData(data)` - Validates maximum length
- [ ] `updateAdvertisingData(data)` - Handles rapid consecutive updates
- [ ] `updateAdvertisingData(data)` - Preserves advertising state during update

- [x] `stopAdvertising()` - Stops advertising successfully
- [x] `stopAdvertising()` - Is idempotent (can call multiple times)
- [ ] `stopAdvertising()` - Handles errors during stop
- [ ] `stopAdvertising()` - Cleans up resources properly

- [x] `isAdvertising()` - Returns true when advertising
- [x] `isAdvertising()` - Returns false when not advertising
- [x] `isAdvertising()` - Updates correctly after state changes

#### BLEAdapter Class - Scanning Functions
- [x] `startScanning(options)` - Starts with valid options
- [x] `startScanning(options)` - Starts with empty options
- [x] `startScanning(options)` - Validates manufacturer ID range (0-0xFFFF)
- [x] `startScanning(options)` - Validates filterByService is array
- [x] `startScanning(options)` - Validates duplicateTimeout is positive
- [x] `startScanning(options)` - Rejects when already scanning
- [x] `startScanning(options)` - Rejects when powered off
- [ ] `startScanning(options)` - Applies manufacturer filter correctly
- [ ] `startScanning(options)` - Applies service UUID filter correctly
- [ ] `startScanning(options)` - Handles allowDuplicates flag
- [ ] `startScanning(options)` - Respects duplicateTimeout
- [ ] `startScanning(options)` - Handles multiple service filters
- [ ] `startScanning(options)` - Handles both manufacturer and service filters

- [x] `stopScanning()` - Stops scanning successfully
- [x] `stopScanning()` - Is idempotent (can call multiple times)
- [ ] `stopScanning()` - Handles errors during stop
- [ ] `stopScanning()` - Cleans up resources properly
- [ ] `stopScanning()` - Stops device discovery immediately

- [x] `isScanning()` - Returns true when scanning
- [x] `isScanning()` - Returns false when not scanning
- [x] `isScanning()` - Updates correctly after state changes

#### BLEAdapter Class - Lifecycle Functions
- [x] `destroy()` - Stops advertising if active
- [x] `destroy()` - Stops scanning if active
- [x] `destroy()` - Removes all event listeners
- [ ] `destroy()` - Releases native resources
- [ ] `destroy()` - Is idempotent (can call multiple times)
- [ ] `destroy()` - Prevents operations after destruction
- [ ] `destroy()` - Handles errors gracefully

#### BLEAdapter Class - Concurrent Operations
- [x] `startAdvertising() + startScanning()` - Both work simultaneously
- [x] `stopAdvertising()` while scanning - Independent operation
- [x] `stopScanning()` while advertising - Independent operation
- [ ] Multiple rapid start/stop cycles
- [ ] State consistency during concurrent operations

### 2. Event Handling Functions

#### State Change Events
- [x] Emits 'stateChange' when state changes
- [x] Forwards state from native adapter
- [ ] Emits correct state for all transitions
- [ ] Handles rapid state changes
- [ ] Updates internal state before emitting
- [ ] Cleans up listeners properly

#### Advertising Events
- [x] Emits 'advertisingStarted' with options
- [x] Emits 'advertisingStopped' when stopped
- [x] Emits 'advertisingDataUpdated' with new data
- [ ] Events include correct timestamps
- [ ] Events are emitted in correct order
- [ ] Error events during advertising

#### Scanning Events
- [x] Emits 'scanningStarted' with options
- [x] Emits 'scanningStopped' when stopped
- [x] Emits 'deviceDiscovered' for each device
- [ ] Device discovery respects filters
- [ ] Device discovery handles duplicates correctly
- [ ] Device discovery includes all required fields
- [ ] Device discovery includes RSSI
- [ ] Device discovery includes timestamp
- [ ] Device discovery parses manufacturer data
- [ ] Device discovery parses service UUIDs

#### Error Events
- [x] Forwards 'error' events from native adapter
- [ ] Emits BLEError instances
- [ ] Includes error codes
- [ ] Includes error messages
- [ ] Includes native error details (when available)

### 3. Data Processing Functions

#### Manufacturer Data Functions
- [ ] `encodeManufacturerData(companyId, payload)` - Creates valid Buffer
- [ ] `encodeManufacturerData(companyId, payload)` - Little-endian company ID
- [ ] `encodeManufacturerData(companyId, payload)` - Validates company ID range
- [ ] `encodeManufacturerData(companyId, payload)` - Validates payload size
- [ ] `encodeManufacturerData(companyId, payload)` - Handles empty payload
- [ ] `encodeManufacturerData(companyId, payload)` - Handles maximum payload

- [ ] `decodeManufacturerData(buffer)` - Extracts company ID
- [ ] `decodeManufacturerData(buffer)` - Extracts payload
- [ ] `decodeManufacturerData(buffer)` - Little-endian company ID parsing
- [ ] `decodeManufacturerData(buffer)` - Validates minimum length
- [ ] `decodeManufacturerData(buffer)` - Handles various buffer sizes

#### Service UUID Functions
- [ ] `validateServiceUUID(uuid)` - Accepts valid 16-bit UUIDs
- [ ] `validateServiceUUID(uuid)` - Accepts valid 128-bit UUIDs
- [ ] `validateServiceUUID(uuid)` - Rejects invalid formats
- [ ] `validateServiceUUID(uuid)` - Handles uppercase/lowercase
- [ ] `validateServiceUUID(uuid)` - Handles with/without dashes

- [ ] `normalizeServiceUUID(uuid)` - Converts to standard format
- [ ] `normalizeServiceUUID(uuid)` - Expands 16-bit to 128-bit
- [ ] `normalizeServiceUUID(uuid)` - Standardizes case
- [ ] `normalizeServiceUUID(uuid)` - Adds/removes dashes consistently

#### Device Data Functions
- [ ] `parseDiscoveredDevice(nativeDevice)` - Extracts all fields
- [ ] `parseDiscoveredDevice(nativeDevice)` - Handles missing optional fields
- [ ] `parseDiscoveredDevice(nativeDevice)` - Parses manufacturer data
- [ ] `parseDiscoveredDevice(nativeDevice)` - Parses service UUIDs
- [ ] `parseDiscoveredDevice(nativeDevice)` - Validates RSSI range
- [ ] `parseDiscoveredDevice(nativeDevice)` - Adds timestamp

### 4. Native Binding Functions (N-API Layer)

#### Adapter Creation
- [ ] `BLEAdapterWrapper::New()` - Creates instance
- [ ] `BLEAdapterWrapper::New()` - Initializes platform adapter
- [ ] `BLEAdapterWrapper::New()` - Sets up callbacks
- [ ] `BLEAdapterWrapper::New()` - Handles initialization errors

#### State Functions
- [ ] `BLEAdapterWrapper::GetState()` - Returns current state
- [ ] `BLEAdapterWrapper::GetState()` - Converts platform state to BLEState
- [ ] `BLEAdapterWrapper::GetState()` - Handles async nature

#### Advertising Functions
- [ ] `BLEAdapterWrapper::StartAdvertising()` - Calls platform implementation
- [ ] `BLEAdapterWrapper::StartAdvertising()` - Converts options to platform format
- [ ] `BLEAdapterWrapper::StartAdvertising()` - Handles async callback
- [ ] `BLEAdapterWrapper::StartAdvertising()` - Returns Promise

- [ ] `BLEAdapterWrapper::UpdateAdvertisingData()` - Calls platform implementation
- [ ] `BLEAdapterWrapper::UpdateAdvertisingData()` - Converts Buffer to platform format
- [ ] `BLEAdapterWrapper::UpdateAdvertisingData()` - Handles async callback

- [ ] `BLEAdapterWrapper::StopAdvertising()` - Calls platform implementation
- [ ] `BLEAdapterWrapper::StopAdvertising()` - Handles async callback

#### Scanning Functions
- [ ] `BLEAdapterWrapper::StartScanning()` - Calls platform implementation
- [ ] `BLEAdapterWrapper::StartScanning()` - Converts options to platform format
- [ ] `BLEAdapterWrapper::StartScanning()` - Sets up device callback

- [ ] `BLEAdapterWrapper::StopScanning()` - Calls platform implementation
- [ ] `BLEAdapterWrapper::StopScanning()` - Cleans up callbacks

#### Callback Functions
- [ ] `StateChangeCallback()` - Converts platform state to JS
- [ ] `StateChangeCallback()` - Emits to JS layer safely
- [ ] `StateChangeCallback()` - Handles thread safety

- [ ] `DeviceDiscoveredCallback()` - Converts platform device to JS object
- [ ] `DeviceDiscoveredCallback()` - Handles missing fields
- [ ] `DeviceDiscoveredCallback()` - Emits to JS layer safely

- [ ] `ErrorCallback()` - Converts platform error to JS
- [ ] `ErrorCallback()` - Creates BLEError instances
- [ ] `ErrorCallback()` - Includes all error details

### 5. Platform Abstraction Layer (C++)

#### IBLEPlatform Interface
- [ ] `GetState()` - Pure virtual interface
- [ ] `StartAdvertising()` - Pure virtual interface
- [ ] `UpdateAdvertisingData()` - Pure virtual interface
- [ ] `StopAdvertising()` - Pure virtual interface
- [ ] `StartScanning()` - Pure virtual interface
- [ ] `StopScanning()` - Pure virtual interface
- [ ] `SetStateChangeCallback()` - Pure virtual interface
- [ ] `SetDeviceDiscoveredCallback()` - Pure virtual interface
- [ ] `SetErrorCallback()` - Pure virtual interface

#### Platform Factory
- [ ] `CreateBLEPlatform()` - Returns correct platform for macOS
- [ ] `CreateBLEPlatform()` - Returns correct platform for Windows
- [ ] `CreateBLEPlatform()` - Returns correct platform for Linux
- [ ] `CreateBLEPlatform()` - Handles unsupported platforms

### 6. Platform-Specific Functions (macOS - CoreBluetooth)

#### BLEPlatformMacOS
- [ ] `Initialize()` - Creates CBCentralManager
- [ ] `Initialize()` - Creates CBPeripheralManager
- [ ] `Initialize()` - Sets up delegates
- [ ] `Initialize()` - Requests Bluetooth permissions

- [ ] `GetState()` - Maps CBManagerState to BLEState
- [ ] `GetState()` - Handles unknown state
- [ ] `GetState()` - Updates on state changes

- [ ] `StartAdvertising()` - Converts options to NSDictionary
- [ ] `StartAdvertising()` - Sets CBAdvertisementDataLocalNameKey
- [ ] `StartAdvertising()` - Sets CBAdvertisementDataServiceUUIDsKey
- [ ] `StartAdvertising()` - Sets manufacturer data correctly
- [ ] `StartAdvertising()` - Calls startAdvertising on peripheral manager
- [ ] `StartAdvertising()` - Handles advertising errors

- [ ] `UpdateAdvertisingData()` - Updates manufacturer data
- [ ] `UpdateAdvertisingData()` - Doesn't restart advertising
- [ ] `UpdateAdvertisingData()` - Handles update errors

- [ ] `StopAdvertising()` - Calls stopAdvertising
- [ ] `StopAdvertising()` - Cleans up resources

- [ ] `StartScanning()` - Converts options to scan parameters
- [ ] `StartScanning()` - Sets up service UUID filters
- [ ] `StartScanning()` - Calls scanForPeripheralsWithServices
- [ ] `StartScanning()` - Handles scan errors

- [ ] `StopScanning()` - Calls stopScan
- [ ] `StopScanning()` - Cleans up scan state

#### CoreBluetooth Delegate Functions
- [ ] `peripheralManagerDidUpdateState:` - Calls state callback
- [ ] `peripheralManagerDidStartAdvertising:error:` - Handles success/error
- [ ] `centralManagerDidUpdateState:` - Calls state callback
- [ ] `centralManager:didDiscoverPeripheral:advertisementData:RSSI:` - Parses device
- [ ] Delegate functions handle thread safety (main queue)

### 7. Platform-Specific Functions (Windows - WinRT)

#### BLEPlatformWindows
- [ ] `Initialize()` - Creates BluetoothLEAdvertisementPublisher
- [ ] `Initialize()` - Creates BluetoothLEAdvertisementWatcher
- [ ] `Initialize()` - Sets up event handlers

- [ ] `GetState()` - Maps Radio state to BLEState
- [ ] `GetState()` - Checks Bluetooth availability

- [ ] `StartAdvertising()` - Creates Advertisement
- [ ] `StartAdvertising()` - Sets LocalName
- [ ] `StartAdvertising()` - Sets ServiceUuids
- [ ] `StartAdvertising()` - Sets manufacturer data (DataSections)
- [ ] `StartAdvertising()` - Calls Start() on publisher

- [ ] `UpdateAdvertisingData()` - Updates DataSections
- [ ] `UpdateAdvertisingData()` - Keeps advertising active

- [ ] `StopAdvertising()` - Calls Stop() on publisher

- [ ] `StartScanning()` - Sets up watcher filters
- [ ] `StartScanning()` - Registers Received event
- [ ] `StartScanning()` - Calls Start() on watcher

- [ ] `StopScanning()` - Calls Stop() on watcher
- [ ] `StopScanning()` - Unregisters events

#### WinRT Event Handlers
- [ ] `OnAdvertisementPublisherStatusChanged` - Maps status to state
- [ ] `OnAdvertisementReceived` - Parses advertisement data
- [ ] `OnAdvertisementReceived` - Extracts manufacturer data
- [ ] `OnAdvertisementReceived` - Extracts service UUIDs
- [ ] Event handlers handle thread safety (COM apartment)

### 8. Platform-Specific Functions (Linux - BlueZ)

#### BLEPlatformLinux
- [ ] `Initialize()` - Connects to D-Bus
- [ ] `Initialize()` - Gets adapter object path
- [ ] `Initialize()` - Sets up signal handlers

- [ ] `GetState()` - Reads Powered property
- [ ] `GetState()` - Maps to BLEState

- [ ] `StartAdvertising()` - Creates advertisement object
- [ ] `StartAdvertising()` - Sets Type property
- [ ] `StartAdvertising()` - Sets LocalName property
- [ ] `StartAdvertising()` - Sets ServiceUUIDs property
- [ ] `StartAdvertising()` - Sets ManufacturerData property
- [ ] `StartAdvertising()` - Calls RegisterAdvertisement

- [ ] `UpdateAdvertisingData()` - Updates ManufacturerData
- [ ] `UpdateAdvertisingData()` - Calls UnregisterAdvertisement + RegisterAdvertisement

- [ ] `StopAdvertising()` - Calls UnregisterAdvertisement

- [ ] `StartScanning()` - Sets discovery filter
- [ ] `StartScanning()` - Calls StartDiscovery

- [ ] `StopScanning()` - Calls StopDiscovery

#### D-Bus Signal Handlers
- [ ] `OnPropertiesChanged` - Handles Powered changes
- [ ] `OnInterfacesAdded` - Detects new devices
- [ ] `OnDeviceAdded` - Parses device properties
- [ ] `OnDeviceAdded` - Extracts ManufacturerData
- [ ] `OnDeviceAdded` - Extracts UUIDs
- [ ] Signal handlers handle thread safety

### 9. Error Handling Functions

#### Error Creation
- [ ] `BLEError::Constructor()` - Creates with code and message
- [ ] `BLEError::Constructor()` - Captures stack trace
- [ ] `BLEError::Constructor()` - Includes native error details

#### Error Conversion
- [ ] `PlatformErrorToBLEError()` - Maps platform-specific errors
- [ ] `PlatformErrorToBLEError()` - Extracts error messages
- [ ] `PlatformErrorToBLEError()` - Assigns correct error codes

#### Error Propagation
- [ ] Errors bubble up from platform → native → JS
- [ ] Errors are emitted as events
- [ ] Errors reject promises appropriately
- [ ] Errors maintain stack traces

### 10. Memory Management Functions

#### Resource Allocation
- [ ] Native objects are properly allocated
- [ ] Buffers are correctly sized
- [ ] Platform resources are initialized

#### Resource Cleanup
- [ ] Buffers are freed properly
- [ ] Native objects are destroyed
- [ ] Platform resources are released
- [ ] Event listeners are removed
- [ ] Callbacks are unregistered

#### Memory Leak Prevention
- [ ] No leaks during normal operation
- [ ] No leaks on error paths
- [ ] No leaks during rapid start/stop
- [ ] No leaks with many devices
- [ ] No leaks with long-running operations

### 11. Performance Functions

#### Timing Requirements
- [ ] Advertising starts within 200ms
- [ ] Data updates complete within 100ms
- [ ] Operations stop within 100ms
- [ ] Device discovery latency < 1s

#### Throughput Requirements
- [ ] Handles 100+ devices without degradation
- [ ] Handles 20+ updates/second
- [ ] Handles rapid start/stop cycles
- [ ] Maintains event emission rate

#### Resource Usage
- [ ] Memory usage < 5MB baseline
- [ ] Memory growth with devices is linear
- [ ] CPU usage is minimal when idle
- [ ] No memory fragmentation

## Test Implementation Priority

### Phase 1: Core TypeScript API (✅ COMPLETE - 36 tests passing)
- [x] BLEAdapter basic functions
- [x] Parameter validation
- [x] Event forwarding
- [x] State management

### Phase 2: Data Processing (NEXT)
- [ ] Manufacturer data encoding/decoding
- [ ] Service UUID validation/normalization
- [ ] Device data parsing
- [ ] Filter functions

### Phase 3: Native Bindings
- [ ] N-API wrapper functions
- [ ] Callback functions
- [ ] Thread safety
- [ ] Error conversion

### Phase 4: Platform Abstraction
- [ ] Interface compliance
- [ ] Factory pattern
- [ ] Platform detection

### Phase 5: Platform Implementation (macOS first)
- [ ] CoreBluetooth integration
- [ ] Delegate functions
- [ ] State management
- [ ] Advertising/scanning

### Phase 6: Integration Tests
- [ ] End-to-end advertising
- [ ] End-to-end scanning
- [ ] Cross-device communication
- [ ] Real hardware testing

### Phase 7: Performance & Stress Tests
- [ ] Timing validation
- [ ] Memory leak detection
- [ ] High-volume scenarios
- [ ] Long-running stability

## Test Execution Strategy

### Unit Tests
- Run with mocks
- Fast execution (< 1 minute)
- No hardware required
- 80%+ coverage requirement

### Integration Tests
- Use mock for platform layer
- Medium execution time (1-5 minutes)
- Simulated hardware
- Test component interaction

### Platform Tests
- Require real hardware
- Per-platform execution
- Slower (5-15 minutes)
- Validate platform-specific code

### End-to-End Tests
- Multiple devices
- Real BLE hardware
- Manual or semi-automated
- Validate real-world scenarios

## Success Criteria

- ✅ All unit tests pass (Phase 1 complete - 36/36)
- [ ] All data processing tests pass
- [ ] All native binding tests pass
- [ ] Platform abstraction tests pass
- [ ] At least one platform fully tested (macOS target)
- [ ] Integration tests pass
- [ ] Performance requirements met
- [ ] No memory leaks detected
- [ ] 80%+ code coverage maintained
