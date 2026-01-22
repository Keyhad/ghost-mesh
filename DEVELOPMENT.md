# GhostMesh Development Guide

## Project Structure

```plain
ghost-mesh/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main application UI
│   ├── layout.tsx         # Root layout with metadata
│   └── globals.css        # Global styles
├── lib/                   # Core libraries
│   ├── types.ts          # TypeScript interfaces
│   ├── storage.ts        # LocalStorage wrapper
│   └── mesh-network.ts   # Mesh networking logic
├── electron/             # Electron desktop app
│   └── main.js          # Electron main process
├── public/              # Static assets
│   └── manifest.json    # PWA manifest
└── components/          # React components (future)
```

## Architecture

### Mesh Network Layer

The `GhostMeshNetwork` class (`lib/mesh-network.ts`) handles:

- WebRTC peer connection management
- Message routing and forwarding
- Device discovery and tracking
- Message queue management

### Data Layer

`storage.ts` provides a simple interface to LocalStorage:

- User phone number
- Contact list
- Message history
- Device registry

### UI Layer

`app/page.tsx` contains the main React component with:

- Three-tab interface (Messages, Contacts, Devices)
- Phone number setup flow
- Real-time device status updates
- Message composition and history

## Key Concepts

### Message Routing

Messages use a flooding algorithm with TTL:

1. Message originates at source device
2. Forwarded to all connected peers (except those in hop history)
3. Each hop decrements TTL
4. Message expires when TTL reaches 0
5. Destination device receives and displays message

### WebRTC Signaling

Currently uses manual signaling (logged to console). For production:

- Implement a signaling server
- Use WebSocket for real-time signaling
- Support STUN/TURN servers for NAT traversal

### Device Discovery

Devices are discovered through:

1. Manual peer connection creation
2. Signal exchange via console/signaling server
3. Automatic reconnection on disconnect

## Development Workflow

### Running Tests

```bash
# No tests yet - add them!
npm test
```

### Linting

```bash
npm run lint
```

### Building

```bash
# Production build
npm run build

# Desktop app build
npm run electron:build
```

## Future Enhancements

### Priority Features

1. **Encryption**: Add end-to-end encryption for messages
2. **Signaling Server**: Implement WebSocket signaling for automatic discovery
3. **STUN/TURN**: Add ICE servers for better NAT traversal
4. **Bluetooth**: Add Bluetooth mesh as fallback
5. **Message Acknowledgment**: Confirm message delivery

### Nice to Have

1. **Group Messaging**: Support group conversations
2. **File Sharing**: Send small files through the mesh
3. **Voice Messages**: Audio message support
4. **Message Search**: Search through message history
5. **Contact Sync**: Export/import contacts

## Security Considerations

### Current Limitations

- Messages are not encrypted
- No authentication mechanism
- Phone numbers are visible to all peers
- No protection against message spoofing

### Recommended Improvements

1. **End-to-End Encryption**:
   - Use Signal Protocol or similar
   - Generate key pairs on setup
   - Exchange keys through QR codes or trusted channel

2. **Message Signing**:
   - Sign messages with private key
   - Verify signature with public key
   - Prevent message tampering

3. **Privacy**:
   - Hash phone numbers for routing
   - Use ephemeral identifiers
   - Implement onion routing for anonymity

## Performance Optimization

### Current Bottlenecks

1. **LocalStorage**: Limited to ~5-10MB
2. **Message Queue**: Grows unbounded
3. **Peer Connections**: Limited by browser (typically ~256)

### Optimization Strategies

1. **IndexedDB**: Switch to IndexedDB for larger storage
2. **Message Pruning**: Implement cleanup policy for old messages
3. **Connection Limits**: Implement smart peer selection
4. **Compression**: Compress messages before transmission

## Browser Compatibility

### Supported Browsers

- Chrome/Edge 80+
- Firefox 75+
- Safari 14+
- Opera 67+

### WebRTC Support

All major browsers support WebRTC, but:

- Safari has limitations on iOS (requires HTTPS)
- Firefox requires specific configuration for multiple peers
- Mobile browsers may have different connection limits

## Contributing Guidelines

1. **Code Style**: Follow existing TypeScript conventions
2. **Type Safety**: Always use proper TypeScript types
3. **Testing**: Add tests for new features
4. **Documentation**: Update README and docs
5. **Security**: Consider security implications

## Debugging

### Enable Debug Logs

In `lib/mesh-network.ts`, uncomment console.log statements:

```typescript
console.log('Message routed:', message);
console.log('Peer connected:', deviceId);
```

### Browser DevTools

1. Open DevTools (F12)
2. Network tab: View WebRTC connections
3. Console tab: See mesh network logs
4. Application tab: Inspect LocalStorage

### Common Issues

**Issue**: Peers not connecting

- Check browser console for errors
- Verify WebRTC is enabled
- Check firewall/network settings

**Issue**: Messages not forwarding

- Verify TTL is > 0
- Check peer connection status
- Inspect message queue

## Testing Strategy

### Unit Tests

- Storage operations
- Message routing logic
- TTL decrementation
- Hop tracking

### Integration Tests

- Peer connection lifecycle
- Message end-to-end delivery
- Device discovery
- UI interactions

### E2E Tests

- Multi-device scenarios
- Message propagation through mesh
- Network partition handling
- Reconnection behavior

## Deployment

### Web Hosting

Deploy to any static host:
- Vercel (recommended for Next.js)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Desktop Distribution

```bash
npm run electron:build
```

Creates installers for:
- Windows (.exe)
- macOS (.dmg)
- Linux (.AppImage)

## License

ISC License - See LICENSE file for details
