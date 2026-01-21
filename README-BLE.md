# GhostMesh BLE Setup

## Architecture

The GhostMesh app now uses a **hybrid architecture** to enable real Bluetooth Low Energy mesh networking:

```
┌─────────────┐         WebSocket          ┌──────────────┐
│   Next.js   │ ◄─────────────────────────► │  BLE Server  │
│   Web UI    │   (ws://localhost:8080)    │  (Node.js)   │
└─────────────┘                             └──────┬───────┘
                                                   │
                                                   │ BLE
                                                   ▼
                                            ┌──────────────┐
                                            │   Physical   │
                                            │ BLE Devices  │
                                            └──────────────┘
```

### Components

1. **Web UI** ([app/page.tsx](app/page.tsx))
   - Next.js React interface
   - Connects to BLE server via WebSocket
   - Manages UI state and user interactions

2. **BLE Server** ([server/ble-server.ts](server/ble-server.ts))
   - Node.js WebSocket server
   - Bridges web UI with native BLE
   - Uses `@abandonware/noble` for BLE operations
   - Handles mesh networking protocol

3. **Mesh Network** ([lib/mesh-network.ts](lib/mesh-network.ts))
   - WebSocket client for web UI
   - Communicates with BLE server
   - Manages local state and storage

## Quick Start

### Option 1: Run Everything Together

```bash
npm run dev:all
```

This starts both the BLE server and Next.js dev server concurrently.

### Option 2: Run Separately

**Terminal 1 - BLE Server:**
```bash
npm run ble-server
```

**Terminal 2 - Web UI:**
```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

## Requirements

### Linux
```bash
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
```

### macOS
Bluetooth should work out of the box. You may need to grant Bluetooth permissions to your terminal app.

### Permissions

On Linux, you may need to run without root by setting capabilities:
```bash
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
```

Or run the BLE server with sudo:
```bash
sudo npm run ble-server
```

## Configuration

Edit [.env.local](.env.local) to change the WebSocket port:

```env
NEXT_PUBLIC_BLE_WS_URL=ws://localhost:8080
WS_PORT=8080
```

## How It Works

1. **Initialization:**
   - User enters phone number in web UI
   - UI connects to BLE server via WebSocket
   - Server initializes BLE mesh node with that phone number

2. **Device Discovery:**
   - BLE server scans for nearby GhostMesh devices
   - Discovered devices are sent to web UI via WebSocket
   - UI updates device list in real-time

3. **Messaging:**
   - User sends message in web UI
   - Message sent to BLE server via WebSocket
   - Server broadcasts via BLE to mesh network
   - Other devices relay message until it reaches destination

4. **Message Reception:**
   - BLE server receives messages from mesh
   - Messages forwarded to web UI via WebSocket
   - UI displays received messages

## Troubleshooting

### "Address family not supported" error (EAFNOSUPPORT)

This usually means:
1. Bluetooth is not available on your system
2. You need sudo/root permissions to access Bluetooth

**Solution 1: Run with sudo (Linux)**
```bash
sudo -E npm run ble-server
```

Or run the full stack with:
```bash
# Terminal 1 - BLE Server with sudo
sudo -E npm run ble-server

# Terminal 2 - Web UI (normal user)
npm run dev
```

**Solution 2: Grant capabilities (Linux, no sudo needed)**
```bash
sudo setcap 'cap_net_raw,cap_net_admin+eip' $(which node)
# or for local node
sudo setcap 'cap_net_raw,cap_net_admin+eip' $(readlink -f .local-node/bin/node)
```

**Solution 3: Check Bluetooth hardware**
```bash
# Verify Bluetooth is available
hciconfig
# or
bluetoothctl list

# If no adapter, check if Bluetooth is enabled
sudo systemctl status bluetooth
sudo systemctl enable bluetooth
sudo systemctl start bluetooth
```

### "Cannot find adapter" or BLE errors

Make sure Bluetooth is enabled:
```bash
# Check Bluetooth status
sudo systemctl status bluetooth

# Enable Bluetooth
sudo systemctl start bluetooth
```

### Web UI shows "WebSocket not connected"

1. Check if BLE server is running: `npm run ble-server`
2. Verify port 8080 is not in use: `lsof -i :8080`
3. Check server logs for errors

### No devices discovered

1. Ensure other GhostMesh devices are nearby and running
2. Check if Bluetooth adapter can scan: `sudo hcitool lescan`
3. Verify BLE permissions (see Permissions section)

### Messages not delivered

1. Check device is connected (green indicator in UI)
2. Verify destination phone number is correct
3. Check mesh network has active relay nodes

## CLI Alternative

You can also use the CLI version without the web UI:

```bash
npx tsx src/cli.ts
```

The CLI directly uses the BLE mesh implementation.

## Development

### File Structure

```
ghost-mesh/
├── server/
│   └── ble-server.ts          # WebSocket BLE server
├── lib/
│   └── mesh-network.ts         # WebSocket client (web)
├── src/
│   ├── mesh.ts                 # BLE mesh implementation
│   ├── protocol.ts             # Message protocol
│   └── cli.ts                  # CLI interface
└── app/
    └── page.tsx                # Web UI
```

### Adding Features

To add new BLE functionality:

1. Update [src/mesh.ts](src/mesh.ts) with new BLE logic
2. Add corresponding command in [server/ble-server.ts](server/ble-server.ts)
3. Update [lib/mesh-network.ts](lib/mesh-network.ts) to use new command
4. Update UI in [app/page.tsx](app/page.tsx)

## Security Notes

- This is a proof-of-concept implementation
- Messages are not encrypted in this version
- No authentication between devices
- For production use, add encryption and authentication layers
