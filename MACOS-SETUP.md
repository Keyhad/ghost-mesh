# macOS Setup Guide for GhostMesh

## Prerequisites

GhostMesh requires native Bluetooth access. macOS has built-in Bluetooth support that works seamlessly with Node.js.

## Install Dependencies with Homebrew

### 1. Install Homebrew (if not already installed)

Open **Terminal** and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js

In Terminal:

```bash
brew install node@20
```

This installs:

- Node.js LTS (Long Term Support)
- npm (Node Package Manager)
- npx (Node Package Executor)

### 3. Install Build Tools

The `@abandonware/noble` package requires native compilation. Install Xcode Command Line Tools:

```bash
xcode-select --install
```

This installs:

- Apple Clang compiler
- macOS SDK
- Build tools needed for node-gyp

**Note:** If you have Xcode installed, the Command Line Tools are already available.

### 4. Check Your Environment

Before proceeding, verify all prerequisites are met:

```bash
./check-macos-env.sh
```

This script checks:
- macOS version
- Homebrew installation
- Node.js version and architecture
- Xcode Command Line Tools
- Python (required by node-gyp)
- Bluetooth status
- Project dependencies
- Build output
- File permissions

### 5. Verify Installation

In Terminal:

```bash
node --version
npm --version
```

You should see version numbers (e.g., v20.x.x and 10.x.x).

## Project Setup

### 6. Install Project Dependencies

Navigate to the project folder:

```bash
cd ~/Projects/ghost-mesh
npm install
```

This installs all required packages including:

- Next.js (web UI framework)
- ws (WebSocket server)
- @abandonware/noble (Bluetooth Low Energy library)
- TypeScript and build tools

**Note:** The first install may take several minutes as `@abandonware/noble` compiles native modules.

### 7. Build BLE Server

Compile the TypeScript server:

```bash
npm run build:server
```

### 8. Final Environment Check

Run the check script again to verify everything is ready:

```bash
./check-macos-env.sh
```

If all checks pass, you're ready to start!

## Running GhostMesh

### Option 1: Run Everything Together

```bash
npm run dev:all
```

This starts both:
- Web UI on http://localhost:3000
- BLE WebSocket server on ws://localhost:8080

### Option 2: Run Separately

**Terminal 1 - BLE Server:**
```bash
npm run ble-server
```

**Terminal 2 - Web UI:**
```bash
npm run dev
```

## Access the Application

1. Open browser: http://localhost:3000
2. Enter your phone number (e.g., +1234567890)
3. Click "Initialize Node"
4. BLE server will scan for nearby GhostMesh devices
5. Discovered devices appear in the Contacts card
6. Send messages through the Bluetooth mesh network

## Troubleshooting

### node-gyp Build Errors

If you see errors during `npm install`:

1. **Ensure Xcode Command Line Tools are installed**:
   ```bash
   xcode-select --install
   ```

2. **Clean and Reinstall**:
   ```bash
   # Remove node_modules and package-lock
   rm -rf node_modules
   rm package-lock.json

   # Clear npm cache
   npm cache clean --force

   # Reinstall dependencies
   npm install
   ```

3. **Check Command Line Tools path**:
   ```bash
   xcode-select -p
   ```
   Should output: `/Library/Developer/CommandLineTools` or `/Applications/Xcode.app/Contents/Developer`

### "Bluetooth state is unknown" Error

If the BLE server shows "Bluetooth state is unknown":

1. **Rebuild the native module**:
   ```bash
   npm rebuild @abandonware/noble
   npm run build:server
   ```

2. **Restart the servers**:
   ```bash
   npm run dev:all
   ```

3. **Check macOS Bluetooth**:
   - Open System Settings → Bluetooth
   - Ensure Bluetooth is turned ON
   - Verify your Bluetooth adapter is working

4. **Grant Bluetooth permissions**:
   - macOS may prompt for Bluetooth access when first running the app
   - Go to System Settings → Privacy & Security → Bluetooth
   - Ensure Terminal (or your terminal app) has Bluetooth access

### Bluetooth Permissions Denied

macOS requires explicit permission for apps to access Bluetooth:

1. Go to System Settings → Privacy & Security → Bluetooth
2. Enable Bluetooth access for Terminal or your terminal emulator (iTerm2, etc.)
3. Restart the BLE server after granting permission

### Port Already in Use

If port 3000 or 8080 is occupied:

```bash
# Find process using port
lsof -i :3000
lsof -i :8080

# Kill process by PID
kill -9 <PID>
```

### WebSocket Connection Failed

Check that BLE server is running:
```bash
# Should show "BLE server listening on port 8080"
npm run ble-server
```

### Python/Architecture Errors

If you see errors about Python or architecture (x86_64 vs arm64):

1. **For Apple Silicon Macs (M1/M2/M3)**:
   ```bash
   # Ensure you're using native ARM64 Node.js
   node -p "process.arch"
   # Should output: arm64
   ```

2. **If using Rosetta 2 (x86_64 on Apple Silicon)**:
   ```bash
   # Install Rosetta if needed
   softwareupdate --install-rosetta

   # Reinstall dependencies
   npm rebuild
   ```

## Architecture

```
┌─────────────┐     WebSocket      ┌─────────────┐      Bluetooth     ┌──────────────┐
│   Web UI    │ ←────────────────→ │ BLE Server  │ ←────────────────→ │   Physical   │
│ localhost:  │   (port 8080)      │  (Node.js)  │     (BLE Mesh)     │   Devices    │
│    3000     │                    │             │                    │              │
└─────────────┘                    └─────────────┘                    └──────────────┘
```

## Next Steps

- Read [BLE-SETUP-COMPLETE.md](BLE-SETUP-COMPLETE.md) for implementation details
- Check [USER_GUIDE.md](USER_GUIDE.md) for usage instructions
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design

## Dependencies Installed

| Package                  | Purpose                             |
| ------------------------ | ----------------------------------- |
| node@20                  | JavaScript runtime with npm         |
| Xcode Command Line Tools | C++ compiler for native modules     |
| next                     | React web framework                 |
| ws                       | WebSocket server implementation     |
| @abandonware/noble       | Native Bluetooth Low Energy library |
| typescript               | Type-safe JavaScript                |
| tailwindcss              | Utility-first CSS framework         |

## Uninstall (Optional)

To remove Node.js:

```bash
brew uninstall node@20
```

To remove Homebrew packages:

```bash
brew cleanup
```

## macOS-Specific Notes

- **Bluetooth is built-in**: macOS has excellent Bluetooth support, no additional drivers needed
- **Privacy permissions**: macOS will prompt for Bluetooth access on first use
- **Apple Silicon compatibility**: The project works natively on both Intel (x86_64) and Apple Silicon (ARM64)
- **Background operation**: macOS may restrict Bluetooth background activity; keep Terminal in foreground during scanning
