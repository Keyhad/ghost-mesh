# Windows Setup Guide for GhostMesh

## Prerequisites

GhostMesh requires native Bluetooth access, so it must run on **Windows natively** (not WSL2 or Docker).

## Install Dependencies with Chocolatey

### 1. Install Chocolatey (if not already installed)

Open **PowerShell as Administrator** and run:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### 2. Install Node.js

In the same **Administrator PowerShell**:

```powershell
choco install nodejs-lts -y
```

This installs:

- Node.js LTS (Long Term Support)
- npm (Node Package Manager)
- npx (Node Package Executor)

### 3. Install Windows Build Tools

The `@abandonware/noble` package requires native compilation. Install Visual Studio Build Tools:

```powershell
choco install visualstudio2022buildtools -y
choco install visualstudio2022-workload-vctools -y
```

This installs:

- Visual Studio 2022 Build Tools
- Desktop development with C++ workload
- Windows SDK and compilers needed for node-gyp

**Alternative:** Install manually from [Visual Studio Downloads](https://visualstudio.microsoft.com/downloads/) and select "Desktop development with C++" workload.

### 4. Verify Installation

Close PowerShell and open a **new terminal** (PowerShell or CMD):

```cmd
node --version
npm --version
```

You should see version numbers (e.g., v20.x.x and 10.x.x).

## Project Setup

### 5. Install Project Dependencies

Navigate to the project folder:

```cmd
cd C:\Users\Keyvan\projects\ghost-mesh
npm install
```

This installs all required packages including:

- Next.js (web UI framework)
- ws (WebSocket server)
- @abandonware/noble (Bluetooth Low Energy library)
- TypeScript and build tools

**Note:** The first install may take several minutes as `@abandonware/noble` compiles native modules.

### 6. Build BLE Server

Compile the TypeScript server:

```cmd
npm run build:server
```

## Running GhostMesh

### Option 1: Run Everything Together

```cmd
npm run dev:all
```

This starts both:
- Web UI on http://localhost:3000
- BLE WebSocket server on ws://localhost:8080

### Option 2: Run Separately

**Terminal 1 - BLE Server:**
```cmd
npm run ble-server
```

**Terminal 2 - Web UI:**
```cmd
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

If you see errors like "Could not find any Visual Studio installation to use":

1. **Install Build Tools** (if not done in step 3):
   ```powershell
   # Run as Administrator
   choco install visualstudio2022buildtools visualstudio2022-workload-vctools -y
   ```

2. **Clean and Reinstall**:
   ```cmd
   # Remove node_modules and package-lock
   rmdir /s /q node_modules
   del package-lock.json

   # Clear npm cache
   npm cache clean --force

   # Reinstall dependencies
   npm install
   ```

3. **If issues persist**, try installing windows-build-tools globally:
   ```powershell
   npm install --global windows-build-tools
   ```

### "Bluetooth state is unknown" Error

If the BLE server shows "Bluetooth state is unknown" after installing Build Tools:

1. **Rebuild the native module** with the newly installed compiler:npm run dev:all
   ```cmd
   npm rebuild @abandonware/noble
   npm run build:server
   ```

2. **Restart the servers**:
   ```cmd
   npm run dev:all
   ```

3. **Check Windows Bluetooth**:
   - Open Settings → Bluetooth & devices
   - Ensure Bluetooth is turned ON
   - Verify your Bluetooth adapter is working in Device Manager

### Bluetooth Not Found

Ensure:
- Windows Bluetooth is enabled (Settings → Bluetooth & devices)
- Bluetooth adapter is recognized (Device Manager → Bluetooth)
- No other Bluetooth apps are blocking the adapter

### Port Already in Use

If port 3000 or 8080 is occupied:

```cmd
# Find process using port
netstat -ano | findstr :3000
netstat -ano | findstr :8080

# Kill process by PID
taskkill /PID <process_id> /F
```

### Permission Denied

Some Bluetooth operations require administrator privileges:
- Right-click PowerShell/CMD
- Select "Run as administrator"
- Navigate to project and run commands

### WebSocket Connection Failed

Check that BLE server is running:
```cmd
# Should show "BLE server listening on port 8080"
npm run ble-server
```

## Architecture

```
┌─────────────┐     WebSocket      ┌─────────────┐     Bluetooth     ┌──────────────┐
│   Web UI    │ ←──────────────→ │ BLE Server  │ ←───────────────→ │   Physical   │
│ localhost:  │   (port 8080)     │  (Node.js)  │   (BLE Mesh)      │   Devices    │
│    3000     │                    │             │                    │              │
└─────────────┘                    └─────────────┘                    └──────────────┘
```

## Next Steps

- Read [BLE-SETUP-COMPLETE.md](BLE-SETUP-COMPLETE.md) for implementation details
- Check [USER_GUIDE.md](USER_GUIDE.md) for usage instructions
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design

## Dependencies Installed

| Package | Purpose |
|---------|---------|
| nodejs-lts | JavaScript runtime with npm |
| visualstudio2022buildtools | C++ compiler for native modules |
| visualstudio2022-workload-vctools | Desktop development with C++ workload |
| next | React web framework |
| ws | WebSocket server implementation |
| @abandonware/noble | Native Bluetooth Low Energy library |
| typescript | Type-safe JavaScript |
| tailwindcss | Utility-first CSS framework |

## Uninstall (Optional)

To remove Node.js:

```powershell
choco uninstall nodejs-lts -y
```

To remove Chocolatey packages cache:

```powershell
choco uninstall all -y
```
