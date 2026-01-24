# Ghost-Mesh Architecture

## Overview

Ghost-Mesh is a decentralized mesh network chat application that operates entirely over Bluetooth Low Energy (BLE) without requiring internet connectivity, servers, or centralized infrastructure.

## Core Components

### 1. Protocol Layer (`src/protocol.ts`)

The protocol layer defines the message format and serialization:

- **Message Structure**: Contains sender/receiver phone numbers, content, unique ID, timestamp, and hop count
- **Serialization**: Converts messages to/from Buffer format for BLE transmission
- **Phone Number Matching**: Direct byte-matching for privacy-preserving routing
- **Message ID Generation**: Creates unique identifiers to prevent relay loops

### 2. Mesh Network Layer (`src/mesh.ts`)

The mesh layer implements the core networking functionality:

- **MeshNode Class**: Main node implementation
- **BLE Scanning**: Continuously scans for nearby mesh nodes
- **Message Broadcasting**: Advertises messages via BLE
- **Auto-Relay**: Automatically rebroadcasts received messages
- **Loop Prevention**: Tracks seen messages to prevent infinite relaying
- **Hop Limiting**: Limits message propagation to 10 hops

### 3. BLE Server (`server/ble-server.ts`)

WebSocket server that bridges the web UI with native BLE:

- **WebSocket Server**: Listens on port 8080 for browser connections
- **Command Handling**: Processes init, send_message, get_devices, disconnect commands
- **Event Broadcasting**: Sends device updates and messages to all connected clients
- **Mesh Node Management**: Creates and manages MeshNode instances per session

### 4. Web UI (`app/page.tsx`)

Next.js-based web interface:

- **Setup Flow**: Phone number registration on first use
- **Dashboard**: Real-time mesh status and statistics
- **Messaging**: Send/receive messages and SOS broadcasts
- **Device Monitoring**: View discovered BLE devices
- **Performance Metrics**: Track mesh network health

## Startup Process

```
┌──────────────────────────────────────────────────────────┐
│              Application Initialization                  │
└──────────────────────────────────────────────────────────┘

1. User runs: npm run dev:all
   │
   ├─→ Starts BLE Server (port 8080)
   │   │
   │   ├─ Compiles TypeScript (tsconfig.server.json)
   │   ├─ Initializes WebSocketServer
   │   └─ Waits for client connections
   │
   └─→ Starts Next.js Dev Server (port 3000)
       │
       ├─ Compiles React components
       └─ Serves web interface

2. User opens browser at localhost:3000
   │
   ├─→ WelcomePage Component loads
   │   └─ Prompts for phone number registration
   │
   └─→ User enters phone number (+65897777)

3. Client establishes WebSocket connection
   │
   └─→ Sends 'init' command with phone number
       │
       └─→ BLE Server creates MeshNode instance

4. MeshNode.start() sequence:
   │
   ├─→ waitForBluetooth()
   │   ├─ Checks noble state (scanning)
   │   ├─ Checks bleno state (advertising)
   │   └─ Waits for 'poweredOn' state (15s timeout)
   │
   ├─→ startScanning()
   │   ├─ Registers 'discover' event handler
   │   ├─ Begins BLE scanning (noble.startScanning())
   │   ├─ Logs: "📡 BLE scanning started"
   │   └─ Sets up 30s periodic device count logging
   │
   ├─→ startAdvertising()
   │   ├─ Initializes advertising with "GhostMesh" name
   │   ├─ Sets up message rotation (2s interval)
   │   ├─ Logs: "📡 BLE advertising started"
   │   └─ Begins broadcasting messages via BLE
   │
   ├─→ startDeviceCleanup()
   │   └─ Sets 5s interval to remove stale devices
   │
   └─→ Emits 'started' event
       └─ Browser receives connection confirmation

5. Ready State - Node is now:
   │
   ├─→ Scanning for nearby BLE devices
   │   ├─ Detects all BLE advertisements
   │   ├─ Filters for "GhostMesh" devices
   │   └─ Extracts message payloads from advertising data
   │
   ├─→ Advertising presence and messages
   │   ├─ Broadcasts "GhostMesh" beacon
   │   ├─ Rotates through queued messages (2s cycle)
   │   └─ Embeds message data in advertising packets
   │
   └─→ Processing incoming messages
       ├─ Deserializes advertising data to Message objects
       ├─ Checks if message is for this node
       ├─ Auto-relays messages (hop < MAX_HOPS)
       └─ Sends to browser via WebSocket

6. User Action - Send SOS:
   │
   ├─→ User clicks "SOS" button
   │   └─ Long press (1s) activates
   │
   ├─→ Browser requests GPS coordinates
   │   ├─ navigator.geolocation.getCurrentPosition()
   │   ├─ 5s timeout, high accuracy mode
   │   └─ Fallback: [No GPS] if unavailable
   │
   ├─→ Creates SOS message
   │   ├─ srcId: current phone number
   │   ├─ destId: "BROADCAST"
   │   ├─ msgId: 0xFFF0 (SOS identifier)
   │   ├─ content: 18-byte binary placeholder
   │   └─ GPS coordinates embedded
   │
   ├─→ Sends via WebSocket
   │   └─ Command: { type: 'send_message', to: 'BROADCAST', content: '...' }
   │
   ├─→ MeshNode.sendMessage()
   │   ├─ Creates Message object with unique ID
   │   ├─ Adds to seenMessages set
   │   ├─ Adds to messageQueue for advertising
   │   └─ Calls broadcastMessage()
   │
   └─→ Message is broadcast via BLE
       ├─ Serialized to Buffer
       ├─ Added to advertising rotation
       ├─ Transmitted in BLE advertising packets
       └─ Logs: "📬 Message sent: [id]"

7. Receiving Device:
   │
   ├─→ Detects BLE advertisement from sender
   │   └─ noble 'discover' event fires
   │
   ├─→ handlePeripheralDiscovered()
   │   ├─ Checks for "GhostMesh" identifier
   │   ├─ Extracts advertising data (service/manufacturer)
   │   └─ Logs device discovery with RSSI
   │
   ├─→ handleMessageReceived()
   │   ├─ Deserializes Buffer to Message object
   │   ├─ Logs: "📨 Message received via BLE advertising"
   │   └─ Calls processReceivedMessage()
   │
   ├─→ processReceivedMessage()
   │   ├─ Checks seenMessages (duplicate prevention)
   │   ├─ Adds to seenMessages set
   │   ├─ Checks if message is for us or BROADCAST
   │   ├─ Emits 'messageReceived' event
   │   └─ Schedules relay if hops < MAX_HOPS
   │
   ├─→ BLE Server forwards to browser
   │   └─ WebSocket event: { type: 'message_received', message: {...} }
   │
   └─→ Browser updates UI
       ├─ Adds to messages list
       ├─ Creates SOS log entry (if msgId = 0xFFF0)
       ├─ Shows notification
       └─ Logs: "Raw SOS Message Object: {...}"
```

## Message Flow

```
┌──────────────────────────────────────────────────────────┐
│                    Message Lifecycle                     │
└──────────────────────────────────────────────────────────┘

1. User sends message
   ↓
2. MeshNode creates Message object
   ↓
3. Message is serialized to Buffer
   ↓
4. Buffer is broadcast via BLE
   ↓
5. Nearby nodes receive broadcast
   ↓
6. Each node checks:
   - Is this for me? (phone number match)
   - Have I seen this before? (message ID)
   - Should I relay? (hop count < MAX_HOPS)
   ↓
7. Node rebroadcasts (auto-relay)
   ↓
8. Process repeats until message reaches destination
   or max hops reached
```

## BLE Implementation

### Dual-Mode Operation

Ghost-Mesh uses both noble (scanning) and bleno (advertising) simultaneously:
- **Noble**: Scans for BLE advertisements from other nodes
- **Bleno**: Broadcasts messages via BLE advertising packets
- **No Connections**: Pure advertising/scanning, no GATT connections

### Service Discovery

Ghost-Mesh uses a custom BLE service identifier:
- Service UUID: `1234` (shortened for advertising)
- Local Name: `GhostMesh`
- Advertising Interval: 100ms
- Message Rotation: 2000ms (cycles through queued messages)

### Advertising Strategy

Messages are embedded directly in BLE advertising packets:
- **Advertising Data**: Up to 31 bytes total per packet
- **Message Payload**: Up to 27 bytes (after headers)
- **Rotation Queue**: Maintains last 10 messages
- **Idle Beacon**: Advertises presence when no messages queued
- **Format**: Serialized JSON message structure

### Collision Avoidance

Random delays (100-500ms) are added before rebroadcasting to reduce collisions.

## Privacy & Security

### Current Implementation

- **Phone Number Privacy**: Uses direct byte-matching
- **No Central Registry**: No lookup tables or directories
- **Message Addressing**: Only intended recipient processes content

### Limitations

- Messages are transmitted in plain text
- No end-to-end encryption
- No sender authentication
- Phone numbers are visible in messages

### Recommended Enhancements

1. **Encryption**: Add AES-256 encryption for message content
2. **Authentication**: Implement public key cryptography
3. **Anonymity**: Consider using hashed phone numbers or ephemeral IDs
4. **Perfect Forward Secrecy**: Implement session keys

## Scalability

### Message Deduplication

The `seenMessages` Set tracks message IDs:
- Prevents processing duplicate messages
- Prevents infinite relay loops
- Auto-cleanup when set grows > 1000 entries

### Network Limits

- **Max Hops**: 10 (configurable)
- **BLE Range**: ~10-100 meters depending on environment
- **Theoretical Network Size**: Unlimited (mesh topology)
- **Practical Limit**: Depends on message density and BLE capacity

## Error Handling

- Invalid messages are silently dropped
- BLE state changes are monitored
- Graceful degradation when Bluetooth is unavailable

## Future Improvements

1. **Persistent Storage**: Save messages to disk
2. **Message Queue**: Implement store-and-forward
3. **Network Topology**: Visualize mesh connections
4. **Performance**: Optimize BLE advertising intervals
5. **Cross-Platform**: Native mobile implementations
6. **Web Bluetooth**: Browser-based nodes
7. **Mesh Routing**: Implement intelligent routing algorithms
8. **Quality of Service**: Priority messaging
9. **Group Chat**: Multicast support
10. **File Transfer**: Binary data support

## Testing Strategy

### Unit Tests
- Protocol serialization/deserialization
- Phone number matching
- Message ID generation

### Integration Tests
- Multi-node mesh simulation
- Message relay verification
- Loop prevention testing

### Manual Testing
- Real BLE device testing
- Range testing
- Multi-hop verification

## Platform Compatibility

| Platform | BLE Support | Status          |
| -------- | ----------- | --------------- |
| Linux    | BlueZ       | ✅ Supported     |
| macOS    | Native      | ✅ Supported     |
| Windows  | Limited     | ❌ Not Supported |
| iOS      | Native      | 🔄 Future        |
| Android  | Native      | 🔄 Future        |

## Dependencies

- **@abandonware/noble**: BLE scanning library (fork of noble)
- **@abandonware/bleno**: BLE advertising library (fork of bleno)
- **ws**: WebSocket server for browser communication
- **TypeScript**: Type safety and modern JavaScript
- **Next.js**: React framework for web UI
- **Node.js**: Runtime environment

## Performance Considerations

- **Memory**: Seen messages cache grows unbounded (needs cleanup)
- **CPU**: Minimal processing per message
- **Network**: BLE bandwidth limited to ~1 Mbps
- **Battery**: Continuous scanning drains battery

## Deployment

Ghost-Mesh is designed for:
- Emergency communications
- Off-grid communities
- Events without cellular coverage
- Privacy-focused messaging
- Experimental mesh networks
