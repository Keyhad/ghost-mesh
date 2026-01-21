# ghost-mesh

A decentralized, off-grid chat application that turns your phone and computer into a mesh radio node. No internet, no servers, no accounts.

> Implies a network that exists even when the "real" one is dead.

## Features

- 📱 **Number-based Routing**: Uses your existing phone number as your ID
- 🔁 **Auto-Relay**: Every device that receives a message automatically rebroadcasts it to extend the range
- 🔒 **Privacy**: Messages are addressed to specific phone numbers via direct byte-matching
- 📡 **Zero Infrastructure**: Works purely on Bluetooth Low Energy (BLE)
- 🌐 **Mesh Network**: Messages hop from device to device to reach their destination
- 💬 **Peer-to-Peer**: Direct communication without central servers

## How It Works

Ghost-Mesh creates a decentralized mesh network where every device acts as both a client and a relay node:

1. **Registration**: Each device registers with a phone number as its unique identifier
2. **Message Sending**: When you send a message, it's broadcast via BLE with the destination phone number
3. **Auto-Relay**: Any device that receives the message checks if it's the intended recipient, then automatically rebroadcasts it
4. **Message Delivery**: Messages hop across the mesh until they reach the destination
5. **Loop Prevention**: Each message has a unique ID and hop count to prevent infinite relaying

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Device A  │──────│   Device B  │──────│   Device C  │
│ +1234567890 │ BLE  │ +0987654321 │ BLE  │ +5555555555 │
└─────────────┘      └─────────────┘      └─────────────┘
      │                     │                     │
      └─────────────────────┼─────────────────────┘
                            │
                    Mesh Network
```

### Message Format

Each message contains:
- `to`: Destination phone number
- `from`: Sender phone number
- `content`: Message text
- `id`: Unique message identifier
- `timestamp`: Message creation time
- `hops`: Number of relays (max 10)

### Privacy

Messages use direct byte-matching for privacy:
- Phone numbers are normalized and compared directly
- No central directory or lookup service
- Messages are only decrypted by the intended recipient

## Installation

```bash
npm install ghost-mesh
```

## Usage

### Command Line Interface

Start the ghost-mesh CLI:

```bash
npx ghost-mesh
```

Or if installed globally:

```bash
npm install -g ghost-mesh
ghost-mesh
```

### Available Commands

```
/register <phone>  - Register your phone number (e.g., /register +1234567890)
/send <to> <msg>   - Send a message (e.g., /send +9876543210 Hello!)
/status            - Show node status
/help              - Show help
/quit              - Exit the application
```

### Example Session

```
ghost-mesh> /register +1234567890
📱 Registering node with phone number: +1234567890
✅ Mesh node started successfully!
🔍 Scanning for nearby nodes...

ghost-mesh> /send +9876543210 Hello from the mesh!
✅ Message sent to +9876543210
📡 Broadcasting message 12345678...

📨 Message from +9876543210:
   Hey! I got your message!
   (1/21/2026, 4:53:17 PM)
```

### Programmatic API

```typescript
import { MeshNode } from 'ghost-mesh';

// Create a mesh node
const node = new MeshNode('+1234567890');

// Listen for messages
node.on('messageReceived', (message) => {
  console.log(`Message from ${message.from}: ${message.content}`);
});

// Start the node
await node.start();

// Send a message
node.sendMessage('+9876543210', 'Hello from the mesh!');
```

## Requirements

- Node.js 16 or higher
- Bluetooth Low Energy (BLE) capable device
- Linux (requires BlueZ) or macOS

### Platform-Specific Setup

**Linux:**
```bash
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
```

**macOS:**
- BLE is supported natively

**Windows:**
- Not currently supported (BLE limitations)

## Development

```bash
# Clone the repository
git clone https://github.com/Keyhad/ghost-mesh.git
cd ghost-mesh

# Install dependencies
npm install

# Build the project
npm run build

# Run the CLI
npm start
```

## Security Considerations

- Messages are currently transmitted in plain text over BLE
- Phone numbers are used as identifiers (consider privacy implications)
- No authentication mechanism (anyone can send messages)
- Consider adding encryption for sensitive communications

## Future Enhancements

- End-to-end encryption
- Message acknowledgments
- Group messaging
- File sharing
- Cross-platform mobile apps
- Web Bluetooth support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC License - see LICENSE file for details

## Disclaimer

This is an experimental project. Use at your own risk. The BLE implementation may vary across platforms and devices.

