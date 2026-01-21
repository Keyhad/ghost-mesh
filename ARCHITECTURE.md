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

### 3. CLI Interface (`src/cli.ts`)

User-facing command-line interface:

- **Node Registration**: Register with a phone number
- **Message Sending**: Send messages to phone numbers
- **Message Reception**: Display incoming messages
- **Status Monitoring**: View node statistics

## Message Flow

```
┌──────────────────────────────────────────────────────────┐
│                    Message Lifecycle                      │
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

### Service Discovery

Ghost-Mesh uses a custom BLE service UUID:
- Service UUID: `12345678-1234-5678-1234-567812345678`
- Characteristic UUID: `87654321-8765-4321-8765-432187654321`

### Advertising Strategy

Messages are embedded in BLE service data for efficient broadcasting:
- Each node advertises its presence
- Service data contains serialized messages
- Nodes continuously scan for service data

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

| Platform | BLE Support | Status |
|----------|-------------|--------|
| Linux    | BlueZ       | ✅ Supported |
| macOS    | Native      | ✅ Supported |
| Windows  | Limited     | ❌ Not Supported |
| iOS      | Native      | 🔄 Future |
| Android  | Native      | 🔄 Future |

## Dependencies

- **@abandonware/noble**: BLE library (fork of noble)
- **TypeScript**: Type safety and modern JavaScript
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
