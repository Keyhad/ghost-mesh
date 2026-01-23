# GhostMesh Electron Desktop Application

This directory contains the Electron wrapper for GhostMesh, creating a native Windows desktop application.

## Prerequisites

- Node.js 18+ installed
- All main project dependencies installed (`npm install` in project root)
- Windows 10/11 64-bit

## Building

### Quick Build

```powershell
.\build-electron.ps1 -Version "1.0.0"
```

### Build Options

```powershell
# Clean build
.\build-electron.ps1 -Version "1.0.0" -Clean

# Build portable executable (no installer)
.\build-electron.ps1 -Version "1.0.0" -Portable

# Both clean and portable
.\build-electron.ps1 -Version "1.0.0" -Clean -Portable
```

## Output

The build creates files in `platform/windows/electron/dist/`:

### Installer (Default)
- `GhostMesh-Setup-1.0.0.exe` - NSIS installer (~200-300MB)
  - Creates Start Menu shortcuts
  - Creates Desktop shortcut
  - Proper uninstaller
  - Auto-update support (future)

### Portable Executable
- `GhostMesh-Portable-1.0.0.exe` - Single executable (~200-300MB)
  - No installation required
  - Run from USB drive
  - All dependencies bundled

## Features

### System Tray Integration
- Runs in background when window closed
- Right-click tray icon for:
  - Show/Hide window
  - Service status
  - Restart services
  - Quit application

### Auto-Start Services
- BLE Server automatically starts on launch
- Next.js web server automatically starts
- No manual terminal commands needed

### Native Windows Integration
- Windows notifications
- File associations (future)
- Auto-start with Windows (optional)

## Architecture

```
Electron Main Process (main.js)
  ├─> BLE Server (Node.js process)
  │   └─> WebSocket on :8080
  │
  ├─> Next.js Server (npm start)
  │   └─> HTTP on :3000
  │
  └─> Browser Window
      └─> Loads http://localhost:3000
```

## Development

### Testing Without Building

```powershell
# In project root
npm install

# In electron folder
cd platform\windows\electron
npm install
npm start
```

This starts Electron in development mode.

### Manual Build Steps

```powershell
# 1. Build main project
cd <project-root>
npm run build:server
npm run build

# 2. Install electron dependencies
cd platform\windows\electron
npm install

# 3. Build with electron-builder
npm run build:installer    # For installer
npm run build:portable     # For portable
npm run build:all          # For both
```

## Configuration

### Customization

Edit `package.json` in this folder:

```json
{
  "build": {
    "appId": "com.ghostmesh.app",
    "productName": "GhostMesh",
    "win": {
      "target": ["nsis", "portable"],
      "icon": "../../../public/icon.ico"
    }
  }
}
```

### Adding/Removing Build Targets

Supported targets:
- `nsis` - Installer
- `portable` - Portable executable
- `zip` - Zip archive
- `appx` - Windows Store package (requires signing)

### Icon

Place your icon at `public/icon.ico` (256x256 recommended).

## Distribution

### Installer Distribution
1. User downloads `GhostMesh-Setup-1.0.0.exe`
2. Runs installer
3. Application installs to `C:\Program Files\GhostMesh`
4. Desktop and Start Menu shortcuts created
5. Launch from shortcuts

### Portable Distribution
1. User downloads `GhostMesh-Portable-1.0.0.exe`
2. Runs executable directly (no installation)
3. Can be run from USB drive
4. All data stored in executable directory

## Size Comparison

| Package Type | Size | Contains |
|--------------|------|----------|
| Node.js Zip | ~800MB | All node_modules |
| Electron Installer | ~250MB | Compressed, bundled |
| Electron Portable | ~250MB | Single executable |

Electron packages are smaller because:
- electron-builder optimizes and compresses
- Only includes necessary native modules
- Removes dev dependencies
- Strips unused code

## Troubleshooting

### Build Fails

```powershell
# Clean everything and rebuild
.\build-electron.ps1 -Version "1.0.0" -Clean
```

### Application Won't Start

1. Check if ports 3000 and 8080 are available
2. Check Windows Defender/Firewall
3. Run as Administrator if needed

### BLE Not Working

- Ensure Bluetooth adapter is connected
- Check Windows Bluetooth settings
- May need Administrator privileges

## Scripts Reference

In `package.json`:

```json
{
  "scripts": {
    "start": "electron .",
    "build:installer": "electron-builder --win nsis",
    "build:portable": "electron-builder --win portable",
    "build:all": "electron-builder --win"
  }
}
```

## Future Enhancements

- [ ] Auto-updater integration
- [ ] Code signing for Windows
- [ ] Windows Store submission
- [ ] Custom protocol handlers (ghostmesh://)
- [ ] Deep linking support
- [ ] Native notifications
- [ ] Background sync
- [ ] System-wide hotkeys

## License

See main project LICENSE file.
