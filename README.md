# GhostMesh 🛰️

A decentralized, off-grid chat application that turns your phone and computer 
into a mesh radio node. No internet, no servers, no accounts.

## Core Features
- **Number-based Routing:** Uses your existing phone number as your ID.
- **Auto-Relay:** Every device that receives a message automatically 
  rebroadcasts it to extend the range.
- **Privacy:** Messages are addressed to specific phone numbers via 
  direct byte-matching.
- **Zero Infrastructure:** Works purely on Bluetooth Low Energy (BLE).

## How it works
1. **Input:** Enter your phone number.
2. **Scan:** The app scans for nearby "GhostMesh" signals.
3. **Chat:** Messages "hop" from device to device until they reach the target.
