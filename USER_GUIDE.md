# GhostMesh User Guide

## What is GhostMesh?

GhostMesh is a peer-to-peer mesh messaging network that allows you to communicate even when traditional networks are unavailable. Messages hop from device to device until they reach their destination.

## Getting Started

### 1. First Time Setup

When you first open GhostMesh, you'll be prompted to enter your phone number. This becomes your unique ID on the mesh network.

```
Example: +1234567890
```

### 2. Adding Contacts

Navigate to the **Contacts** tab and add people you want to message:
- Enter their name
- Enter their phone number
- Click "Add Contact"

### 3. Sending Messages

Go to the **Messages** tab:
1. Select a contact from the dropdown
2. Type your message
3. Click "Send via Mesh"

Your message will be queued and forwarded through the mesh network until it reaches the destination device.

## How Mesh Networking Works

### Message Routing

1. **Direct Connection**: If the destination device is directly connected, the message is delivered immediately
2. **Multi-hop**: If not directly connected, the message hops through intermediate devices
3. **TTL (Time To Live)**: Each message can hop up to 10 times before expiring
4. **Hop Tracking**: The message tracks which devices it has visited to prevent loops

### Device Discovery

The **Devices** tab shows:
- All nearby GhostMesh devices
- Connection status (Connected/Offline)
- Last seen timestamp

WebRTC automatically discovers and connects to nearby devices running GhostMesh.

## Platform Support

### Mobile (PWA)

1. Open GhostMesh in your mobile browser
2. Tap the browser menu
3. Select "Add to Home Screen"
4. The app will be installed like a native app

### Desktop (Web)

Simply open http://localhost:3000 in your browser after running:
```bash
npm run dev
```

### Desktop (Electron)

For a native desktop experience:
```bash
npm run electron:dev
```

## Data Storage

All data is stored locally on your device:
- Your phone number
- Contact list
- Message history
- Connected devices

No data is sent to any server - everything is peer-to-peer!

## Tips for Best Results

1. **Keep the app open**: The app needs to be running to forward messages
2. **Add multiple contacts**: The more devices in the mesh, the better the coverage
3. **Stay in range**: WebRTC works best when devices are nearby
4. **Be patient**: Multi-hop messages take time to reach their destination

## Troubleshooting

### Messages not sending?
- Ensure you have contacts added
- Check if any devices are connected
- Verify the destination phone number is correct

### No devices discovered?
- Make sure other devices are running GhostMesh
- Check that WebRTC is enabled in your browser
- Try refreshing the page

### App not loading?
- Clear browser cache
- Check console for errors (F12 in browser)
- Verify all dependencies are installed: `npm install`

## Privacy & Security

- All communication is peer-to-peer
- No central server stores your data
- Messages are not encrypted by default (consider adding encryption for sensitive communications)
- Phone numbers are used only for routing, not authentication

## Contributing

GhostMesh is designed to be minimal and efficient. If you have suggestions or improvements, please open an issue or pull request!

## License

ISC License - See LICENSE file for details
