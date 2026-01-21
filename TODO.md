# GhostMesh TODO

## 🔴 Critical - Core Functionality

### BLE Broadcasting/Advertising
- [ ] Research Windows BLE advertising limitations
- [ ] Implement BLE GATT server for advertising
- [ ] Add service UUID broadcasting with message payload
- [ ] Test advertising on different platforms
- [ ] Fallback mechanism for Windows (if needed)

### Message Relay Testing
- [ ] Test with 2 physical devices
- [ ] Test with 3+ devices (multi-hop)
- [ ] Verify message deduplication works
- [ ] Test loop prevention (TTL/hop count)
- [ ] Measure actual BLE range in different environments

## 📱 High Priority - Mobile Platform

### Mobile App Development
- [ ] Choose framework (React Native / Flutter)
- [ ] Set up mobile project structure
- [ ] Implement BLE scanning for mobile
- [ ] Implement BLE advertising for mobile
- [ ] Port protocol.ts to mobile
- [ ] Build basic chat UI for mobile
- [ ] Test iOS BLE permissions
- [ ] Test Android BLE permissions
- [ ] Cross-platform testing (iOS ↔ Android)
- [ ] Desktop ↔ Mobile testing

## 🧪 Testing & Debugging

### BLE Testing Tools
- [ ] Create BLE packet inspector tool
- [ ] Build mock BLE device simulator
- [ ] Add network visualization dashboard
- [ ] Implement RSSI (signal strength) monitoring
- [ ] Create automated mesh network tests
- [ ] Add performance benchmarks
- [ ] Log message delivery success rates

### Protocol Testing
- [ ] Test message serialization/deserialization
- [ ] Verify phone number matching edge cases
- [ ] Test with international phone numbers
- [ ] Test message size limits
- [ ] Test hop count limit behavior
- [ ] Stress test with many simultaneous messages

## 📊 UI/UX Improvements

### Desktop Web App
- [ ] Add discovered devices panel with details
- [ ] Show signal strength (RSSI) per peer
- [ ] Display message hop path visualization
- [ ] Add connection quality indicators
- [ ] Show BLE scan status and device count
- [ ] Add message delivery status (sent/relayed/received)
- [ ] Implement message timestamps
- [ ] Add message search/filter
- [ ] Dark mode improvements

### Discovery & Network View
- [ ] Real-time network topology map
- [ ] Show active relay nodes
- [ ] Display mesh network health
- [ ] Add peer discovery notifications
- [ ] Show message routing paths

## 📡 Protocol Enhancements

### Reliability
- [ ] Implement message acknowledgments (ACK)
- [ ] Add message retry logic
- [ ] Better TTL management algorithm
- [ ] Implement message priority levels
- [ ] Add message expiry (time-based)

### Efficiency
- [ ] Message compression for large payloads
- [ ] Optimize BLE packet size usage
- [ ] Implement message batching
- [ ] Reduce redundant broadcasts
- [ ] Smart relay selection (RSSI-based)

### Features
- [ ] Group messaging support
- [ ] Broadcast messages (to all)
- [ ] Read receipts (optional)
- [ ] Typing indicators
- [ ] Message reactions

## 💾 Storage & Persistence

### Local Storage
- [ ] Improve message history storage
- [ ] Add message pagination
- [ ] Implement contact management
- [ ] Add conversation threads
- [ ] Export/backup conversations
- [ ] Import conversation history
- [ ] Clear old messages automatically

### Sync
- [ ] Sync messages across user's devices
- [ ] Conflict resolution for multi-device
- [ ] Device pairing mechanism

## 🔒 Security (Future)

### Encryption
- [ ] Design E2E encryption scheme (PKI)
- [ ] Implement key exchange protocol
- [ ] Add message signing
- [ ] Verify sender authenticity
- [ ] Implement forward secrecy
- [ ] Add key rotation

### Privacy
- [ ] Obfuscate phone numbers in transit
- [ ] Add optional pseudonyms
- [ ] Implement message padding (hide size)
- [ ] Add metadata protection

## 🛠️ Developer Experience

### Documentation
- [ ] API documentation for MeshNode
- [ ] Protocol specification document
- [ ] Mobile development guide
- [ ] Contribution guidelines
- [ ] Add code examples

### Build & Deploy
- [ ] Set up CI/CD pipeline
- [ ] Add automated tests
- [ ] Create Docker development environment
- [ ] Add pre-commit hooks
- [ ] Version release automation

### Code Quality
- [ ] Add ESLint rules
- [ ] Add Prettier configuration
- [ ] Increase test coverage
- [ ] Add type safety improvements
- [ ] Code documentation (JSDoc)

## 🌐 Platform Support

### Windows
- [x] BLE scanning support
- [x] Visual Studio Build Tools setup
- [x] Bluetooth state detection
- [ ] BLE advertising (limited - needs research)
- [ ] Windows installer

### macOS
- [ ] Test BLE scanning
- [ ] Test BLE advertising
- [ ] macOS app bundle

### Linux
- [ ] Test with BlueZ
- [ ] Test on Raspberry Pi
- [ ] Linux package (deb/rpm)

### Web
- [ ] Web Bluetooth API support
- [ ] Progressive Web App (PWA)
- [ ] Browser compatibility matrix

## 📦 Distribution

### Packaging
- [ ] NPM package publishing
- [ ] Desktop app (Electron)
- [ ] Mobile app stores (iOS/Android)
- [ ] Windows Store
- [ ] Mac App Store

### Installation
- [ ] Simplify setup process
- [ ] One-click installers
- [ ] Auto-update mechanism

## 🎯 Use Cases & Features

### Emergency Communication
- [ ] SOS/emergency broadcast mode
- [ ] Location sharing
- [ ] Battery status indicators
- [ ] Offline maps integration

### Community Features
- [ ] Public channels
- [ ] Local bulletin board
- [ ] File sharing (small files)
- [ ] Voice messages (compressed)

## 📝 Documentation Updates

- [ ] Update README with Windows support
- [ ] Add ARCHITECTURE.md details
- [ ] Create PROTOCOL.md specification
- [ ] Write USER_GUIDE.md
- [ ] Add troubleshooting guide
- [ ] Create video tutorials

## 🐛 Known Issues

### Current Bugs
- [ ] Fix 404 for icon-192.png
- [ ] Improve WebSocket reconnection logic
- [ ] Handle BLE adapter disconnect/reconnect
- [ ] Fix race conditions in message relay

### Performance
- [ ] Optimize BLE scan frequency
- [ ] Reduce memory usage for message cache
- [ ] Improve UI rendering performance

---

## Priority Order

1. **BLE Broadcasting** - Without this, devices can't announce themselves
2. **Mobile App** - The natural platform for mesh networking
3. **Testing Tools** - Need to verify the mesh actually works
4. **UI Improvements** - Better visibility of network status
5. **Protocol Enhancements** - Reliability and efficiency
6. **Security** - Future consideration when core works

---

*Last updated: January 21, 2026*
