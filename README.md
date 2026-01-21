# GhostMesh

A peer-to-peer mesh messaging network that exists even when the "real" network is dead.

## Features

- **Phone Number ID**: Use your phone number as your source ID on the mesh network
- **Contact-based Messaging**: Send messages to contacts via their phone numbers
- **Mesh Networking**: Messages hop from device to device until reaching destination
- **Peer Discovery**: Scan for nearby GhostMesh signals using WebRTC
- **Multi-platform**: Works on mobile (PWA) and desktop (Electron)
- **Offline-first**: Operates without internet connectivity using local mesh

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the app.

### Mobile (PWA)

1. Build the app: `npm run build`
2. Start the production server: `npm start`
3. On mobile, open the app in a browser and select "Add to Home Screen"

### Desktop (Electron)

```bash
npm run electron:dev
```

## How It Works

1. **Setup**: Enter your phone number to join the mesh network
2. **Add Contacts**: Add phone numbers of people you want to message
3. **Send Messages**: Select a contact and send a message - it will hop through the mesh
4. **Device Discovery**: Nearby devices running GhostMesh are automatically discovered
5. **Message Routing**: Messages are forwarded device-to-device until reaching the destination

## Architecture

- **Next.js**: React framework for the UI
- **WebRTC**: Peer-to-peer connections via SimplePeer
- **LocalStorage**: Client-side data persistence
- **Tailwind CSS**: Responsive styling

## License

ISC
