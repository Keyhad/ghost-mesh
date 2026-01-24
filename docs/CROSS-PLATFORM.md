# Cross-Platform Development Guide

## Platform Detection

GhostMesh automatically detects the platform at runtime and loads the appropriate Bluetooth libraries.

### Automatic Platform Selection

**src/mesh.ts:**
```typescript
if (process.platform === 'win32') {
  // Windows: @stoprocent/noble (scanning only)
  noble = require('@stoprocent/noble');
  bleno = null;
} else {
  // macOS/Linux: @abandonware libraries (full support)
  noble = require('@abandonware/noble');
  bleno = require('@abandonware/bleno');
}
```

### Platform Capabilities

| Platform | Scanning | Advertising | Notes |
|----------|----------|-------------|-------|
| **macOS** | ✅ Full | ✅ Full | Best experience, uses CoreBluetooth |
| **Linux** | ✅ Full | ✅ Full | Uses BlueZ, requires permissions |
| **Windows** | ✅ Full | ❌ No | Scanning works, advertising not supported |

## Development Workflow

### Switching Between macOS and Windows

**Safe to do:**
- ✅ Git pull/push between platforms
- ✅ `npm install` on each platform
- ✅ Run server on either platform
- ✅ Commit code from either platform

**Package.json includes both:**
```json
{
  "@abandonware/noble": "^1.9.2-26",  // macOS/Linux
  "@abandonware/bleno": "^0.6.2",     // macOS/Linux
  "@stoprocent/noble": "^2.3.10"      // Windows
}
```

All platforms install all packages, but only the correct one is loaded at runtime.

### Testing Strategy

1. **Frontend development**: Use either platform
2. **BLE mesh testing**:
   - **Full mesh**: Test on macOS (or Linux)
   - **Receive-only**: Test on Windows
   - **Cross-platform**: macOS sends → Windows receives

### Git Workflow

**Safe to commit from any platform:**
- No platform-specific generated files in git
- `dist/` is in `.gitignore`
- `node_modules/` is in `.gitignore`
- TypeScript source is platform-agnostic

## Setup on Each Platform

### macOS/Linux
```bash
npm install
npm run dev:all
```

### Windows
```powershell
npm install
npm run dev:all
# Note: Advertising disabled, scanning works
```

## Common Issues

### "Cannot find module" after switching platforms

**Solution:**
```bash
# Clean install
rm -rf node_modules dist
npm install
npm run build:server
```

### Different behavior between platforms

This is expected:
- **Windows**: Can receive messages, cannot send
- **macOS/Linux**: Full bidirectional mesh

### Node version differences

Ensure compatible Node.js version:
- macOS: Node.js 18+ works
- Windows: Node.js 20+ recommended for better Bluetooth support

## CI/CD Considerations

### Testing Matrix

```yaml
platform:
  - macos-latest    # Full BLE testing
  - ubuntu-latest   # Full BLE testing
  - windows-latest  # Frontend + scanning only
```

### Build Artifacts

Platform-specific native modules are compiled during `npm install`:
- macOS: BlueZ bindings
- Windows: WinRT bindings
- Linux: BlueZ HCI

**Do not** commit `node_modules` or `dist/`.

## Best Practices

1. **Develop on macOS for full features**
2. **Test on Windows for receive-only mode**
3. **Use git normally - no platform conflicts**
4. **Run `npm install` after pulling on different platform**
5. **Check platform logs on startup** to confirm correct libraries loaded

## Platform-Specific Features

### Code that only runs on macOS/Linux:
```typescript
if (bleno) {
  // Advertising code
  bleno.startAdvertising(...);
}
```

### Code that runs on all platforms:
```typescript
// Scanning works everywhere
noble.on('discover', ...);
```

## Debugging Platform Issues

**Check which library is loaded:**
```bash
# Should show platform-specific message
npm run ble-server

# macOS: "🍎 Using macOS/Linux Bluetooth bindings"
# Windows: "🪟 Using Windows Bluetooth bindings"
```

**Verify noble is working:**
```bash
# Both platforms should scan successfully
npm run ble-server
# Look for: "✅ 📡 BLE scanning started"
```

## Summary

✅ **No conflicts** between macOS and Windows development
✅ **Safe to switch** platforms and push/pull code
✅ **Runtime detection** ensures correct libraries load
✅ **Both platforms** can coexist in git repo

The only difference is **capability** - macOS has full mesh, Windows has receive-only.
