# BLE Mesh Communication Options

## Problem Statement

Traditional BLE GATT connections require:
- Device pairing/consent from both parties
- Connection overhead and latency
- User interaction (approval on locked devices)

This makes GATT unsuitable for autonomous emergency mesh networks where devices must relay messages without user intervention.

---

## Option 1: Native CoreBluetooth Integration (Long-term Solution)

### Overview
Build a native Node.js addon that directly interfaces with macOS CoreBluetooth framework, giving full control over BLE advertising and scanning.

### Advantages
- ✅ **Full control** over advertising data (up to 254 bytes with Extended Advertising)
- ✅ **Bluetooth 5.0 Extended Advertising** support
- ✅ **No pairing required** - pure broadcast/receive
- ✅ **Native performance** - no JavaScript BLE library limitations
- ✅ **Manufacturer-specific data** - custom payload format
- ✅ **Service data** - attach data to service UUIDs
- ✅ **Optimal for emergency mesh** - true connectionless operation

### Technical Implementation

#### Architecture
```
┌─────────────────────────────────────────┐
│  Node.js Application (TypeScript)       │
├─────────────────────────────────────────┤
│  Native Addon (C++/Objective-C++)       │
│  - CBCentralManager (scanning)          │
│  - CBPeripheralManager (advertising)    │
├─────────────────────────────────────────┤
│  CoreBluetooth Framework (macOS)        │
└─────────────────────────────────────────┘
```

#### Required Components

**1. Native Addon Structure**
```
native/
├── binding.gyp              # Build configuration
├── src/
│   ├── bluetooth_manager.mm # Objective-C++ implementation
│   ├── bluetooth_manager.h  # Header file
│   └── addon.cc             # Node.js binding
└── index.js                 # JavaScript wrapper
```

**2. CoreBluetooth APIs to Use**
- `CBPeripheralManager` - for advertising
- `CBCentralManager` - for scanning
- `CBAdvertisementData` - custom advertising payload
- `CBCharacteristic` - if extended data needed

**3. Advertising Data Format**
```
Advertisement Data (up to 254 bytes with BT 5.0):
┌──────────────────────────────────────────┐
│ Flags (3 bytes)                          │
├──────────────────────────────────────────┤
│ Complete Local Name (11 bytes)           │
│ "GhostMesh"                              │
├──────────────────────────────────────────┤
│ Service UUID (4 bytes)                   │
│ 0x1234                                   │
├──────────────────────────────────────────┤
│ Service Data or Manufacturer Data        │
│ - Message ID (16 bytes)                  │
│ - From (10 bytes)                        │
│ - To (10 bytes)                          │
│ - Content (up to 200 bytes)              │
│ - Hops (1 byte)                          │
│ - Timestamp (8 bytes)                    │
└──────────────────────────────────────────┘
```

### Implementation Steps

#### Phase 1: Setup (1-2 days)
1. Install Xcode Command Line Tools
2. Create `binding.gyp` for node-gyp
3. Set up Objective-C++ source files
4. Configure build environment

#### Phase 2: Core Implementation (3-5 days)
1. **Advertising Manager**
   ```objective-c
   @interface BluetoothAdvertiser : NSObject <CBPeripheralManagerDelegate>
   - (void)startAdvertisingWithData:(NSData*)messageData;
   - (void)stopAdvertising;
   @end
   ```

2. **Scanning Manager**
   ```objective-c
   @interface BluetoothScanner : NSObject <CBCentralManagerDelegate>
   - (void)startScanning;
   - (void)stopScanning;
   - (void)centralManager:didDiscoverPeripheral:advertisementData:RSSI:;
   @end
   ```

3. **Node.js Bindings**
   ```cpp
   #include <node_api.h>

   napi_value StartAdvertising(napi_env env, napi_callback_info info);
   napi_value StartScanning(napi_env env, napi_callback_info info);
   napi_value Init(napi_env env, napi_value exports);
   ```

#### Phase 3: Integration (2-3 days)
1. Replace `@abandonware/bleno` with native addon
2. Replace `@abandonware/noble` with native addon
3. Update message serialization for larger payloads
4. Test cross-device communication

#### Phase 4: Testing & Optimization (2-3 days)
1. Memory leak testing
2. Battery usage optimization
3. Message relay performance
4. Multi-device mesh testing

### Dependencies
```json
{
  "devDependencies": {
    "node-gyp": "^10.0.1",
    "bindings": "^1.5.0"
  }
}
```

### Build Configuration (binding.gyp)
```python
{
  "targets": [{
    "target_name": "bluetooth_native",
    "sources": [
      "native/src/addon.cc",
      "native/src/bluetooth_manager.mm"
    ],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")"
    ],
    "libraries": [
      "-framework CoreBluetooth",
      "-framework Foundation"
    ],
    "cflags!": [ "-fno-exceptions" ],
    "cflags_cc!": [ "-fno-exceptions" ],
    "xcode_settings": {
      "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
      "CLANG_CXX_LIBRARY": "libc++",
      "MACOSX_DEPLOYMENT_TARGET": "10.13"
    }
  }]
}
```

### Expected Outcomes
- **254-byte messages** in a single advertisement
- **No connection overhead** - instant message relay
- **10-20ms latency** for message broadcast
- **Battery efficient** - no active connections
- **Scalable** - supports 100+ devices in mesh

### Estimated Effort
- **Total Time**: 8-13 days
- **Skill Level**: Advanced (Objective-C++, CoreBluetooth, Native Addons)
- **Risk**: Medium (platform-specific, requires native debugging)

---

## Option 3: Manufacturer Data Workaround (Quick Fix)

### Overview
Use the existing `@abandonware/bleno` library's manufacturer data field (27 bytes available) to embed essential message information in BLE advertising packets.

### Advantages
- ✅ **Works immediately** - no new dependencies
- ✅ **No pairing required** - pure advertising
- ✅ **Cross-platform** - works on macOS/Linux/Windows
- ✅ **Easy to test** - simple implementation
- ✅ **Proven technology** - manufacturer data is standard BLE

### Limitations
- ⚠️ **27-byte payload limit** - need efficient encoding
- ⚠️ **Message compression required** - can't send full content
- ⚠️ **Multiple advertisements** - long messages need chunking
- ⚠️ **No guaranteed delivery** - advertising may be missed

### Technical Implementation

#### Message Encoding Strategy

**Compact Binary Format (27 bytes max):**
```
Byte Layout:
┌───────────────────────────────────────────┐
│ 0-1:   Company ID (0xFFFF = custom)       │
├───────────────────────────────────────────┤
│ 2-9:   Message ID (8 bytes, timestamp)    │
├───────────────────────────────────────────┤
│ 10-13: From Phone (4 bytes, last digits)  │
├───────────────────────────────────────────┤
│ 14-17: To Phone (4 bytes, last digits)    │
├───────────────────────────────────────────┤
│ 18:    Message Type (1 byte)              │
│        0x01 = SOS                          │
│        0x02 = Text                         │
│        0x03 = GPS                          │
├───────────────────────────────────────────┤
│ 19:    Hops (1 byte, 0-255)               │
├───────────────────────────────────────────┤
│ 20-23: GPS Lat (4 bytes, float)           │
├───────────────────────────────────────────┤
│ 24-26: GPS Lon (3 bytes, compressed)      │
└───────────────────────────────────────────┘
```

#### For Longer Messages
**Chunking Strategy:**
```
Message > 10 chars → Multiple advertisements
- Chunk 1: Header + First 10 chars
- Chunk 2: Continuation + Next 10 chars
- Each chunk references same Message ID
```

#### Implementation Code Structure

**Encoding:**
```typescript
function encodeMessageToManufacturerData(message: Message): Buffer {
  const buffer = Buffer.alloc(27);

  // Company ID (0xFFFF = custom)
  buffer.writeUInt16LE(0xFFFF, 0);

  // Message ID (use timestamp as 8-byte ID)
  buffer.writeBigUInt64LE(BigInt(message.timestamp), 2);

  // Phone numbers (last 4 digits only)
  const fromDigits = parseInt(message.from.slice(-4));
  const toDigits = parseInt(message.to.slice(-4));
  buffer.writeUInt32LE(fromDigits, 10);
  buffer.writeUInt32LE(toDigits, 14);

  // Message type
  buffer.writeUInt8(message.content.startsWith('🆘') ? 0x01 : 0x02, 18);

  // Hops
  buffer.writeUInt8(message.hops, 19);

  // GPS (if available)
  if (message.content.includes('GPS:')) {
    const gpsMatch = message.content.match(/GPS: ([-\d.]+), ([-\d.]+)/);
    if (gpsMatch) {
      const lat = parseFloat(gpsMatch[1]);
      const lon = parseFloat(gpsMatch[2]);
      buffer.writeFloatLE(lat, 20);
      // Compress longitude to 3 bytes (sufficient precision)
      const lonCompressed = Math.round((lon + 180) * 46603); // 24-bit resolution
      buffer.writeUIntLE(lonCompressed, 24, 3);
    }
  }

  return buffer;
}
```

**Decoding:**
```typescript
function decodeManufacturerData(data: Buffer): Message | null {
  if (data.length < 20) return null;

  const companyId = data.readUInt16LE(0);
  if (companyId !== 0xFFFF) return null;

  const timestamp = Number(data.readBigUInt64LE(2));
  const fromDigits = data.readUInt32LE(10).toString().padStart(4, '0');
  const toDigits = data.readUInt32LE(14).toString().padStart(4, '0');
  const messageType = data.readUInt8(18);
  const hops = data.readUInt8(19);

  let content = messageType === 0x01 ? '🆘 SOS Emergency!' : 'Message';

  // Decode GPS if present
  if (data.length >= 27) {
    const lat = data.readFloatLE(20);
    const lonCompressed = data.readUIntLE(24, 3);
    const lon = (lonCompressed / 46603) - 180;
    content += ` GPS: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }

  return {
    id: `${timestamp}-${fromDigits}`,
    from: `***${fromDigits}`,
    to: `***${toDigits}`,
    content,
    timestamp,
    hops
  };
}
```

### Integration Points

**In `updateAdvertisingData()`:**
```typescript
const manufacturerData = encodeMessageToManufacturerData(message);

// bleno's internal API allows manufacturer data
(bleno as any).startAdvertising(
  'GhostMesh',
  [GHOST_MESH_SERVICE_UUID],
  manufacturerData, // Pass as 3rd argument
  (error) => {
    if (error) logger.error('Advertising error:', error);
  }
);
```

**In `handlePeripheralDiscovered()`:**
```typescript
if (advertisement.manufacturerData) {
  const companyId = advertisement.manufacturerData.readUInt16LE(0);
  if (companyId === 0xFFFF) { // Our custom format
    const message = decodeManufacturerData(advertisement.manufacturerData);
    if (message) {
      this.processReceivedMessage(message);
    }
  }
}
```

### Testing Strategy
1. **Single Device**: Verify encoding/decoding
2. **Two Devices**: Test laptop ↔ iMac communication
3. **Three Devices**: Test relay through middle device
4. **Message Types**: Test SOS, text, GPS coordinates
5. **Edge Cases**: Max hops, duplicate detection

### Optimization Tips
- **Phone Number Compression**: Use last 4 digits only (10,000 combinations)
- **GPS Compression**: 24-bit longitude = ~4-meter precision (sufficient for emergency)
- **Message Rotation**: Change advertised message every 500ms
- **Priority Queue**: Advertise SOS messages more frequently

### Expected Performance
- **Message Size**: SOS with GPS = 27 bytes (perfect fit!)
- **Latency**: 100-500ms for single hop
- **Range**: 10-30 meters typical
- **Relay**: 3-5 hops before degradation
- **Battery**: Minimal impact on advertising device

### Migration Path to Option 1
Once Option 1 is ready:
1. Keep same message encoding format
2. Expand payload to 254 bytes
3. Add full phone numbers
4. Add message content (not just type)
5. Add encryption
6. No code changes needed in UI layer

---

## Recommendation

### Immediate Action
✅ **Implement Option 3 now** to:
- Validate mesh concept
- Test cross-device communication
- Demonstrate to users/stakeholders
- Gather real-world performance data

### Next 3-6 Months
✅ **Plan Option 1 implementation** to:
- Remove 27-byte limitation
- Improve message reliability
- Add full message content
- Prepare for production deployment

### Timeline
```
Week 1-2:  Option 3 implementation & testing
Week 3-4:  Field testing with multiple devices
Month 2-3: Begin Option 1 development
Month 4-6: Replace Option 3 with Option 1
Month 6+:   Production-ready mesh network
```
