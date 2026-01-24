# Web Bluetooth Setup for Windows

## Overview

Web Bluetooth API provides BLE mesh functionality directly in Chrome/Edge browsers on Windows, bypassing the need for native Node.js BLE drivers.

## Browser Requirements

- **Chrome/Edge**: Version 90+
- **Opera**: Version 76+
- **Android Chrome**: Full support
- **Safari**: Limited support (iOS 16+)

## Features

| Feature | Web Bluetooth | Native (macOS/Linux) |
|---------|--------------|---------------------|
| BLE Scanning | ✅ Yes | ✅ Yes |
| Read advertisements | ✅ Yes | ✅ Yes |
| BLE Advertising | ⚠️ Experimental | ✅ Yes |
| Background operation | ❌ No | ✅ Yes |

## Setup

### 1. Enable Experimental Features (For Advertising)

**Chrome/Edge:**
1. Navigate to: `chrome://flags/#enable-experimental-web-platform-features`
2. Set to **Enabled**
3. Restart browser

**Specific Bluetooth Flags:**
- `chrome://flags/#enable-web-bluetooth`
- `chrome://flags/#enable-web-bluetooth-new-permissions-backend`

### 2. HTTPS Requirement

Web Bluetooth requires HTTPS in production. For local development:
- `localhost` works without HTTPS
- Use `ngrok` or `localtunnel` for remote testing

### 3. How It Works

```typescript
// Automatically falls back to Web Bluetooth
const network = new GhostMeshNetwork('+1234567890');

// Web Bluetooth will activate if:
// 1. WebSocket connection fails
// 2. Browser supports Web Bluetooth
// 3. User grants permission
```

### 4. User Flow

1. **App loads**: Tries WebSocket connection to BLE server
2. **Connection fails**: Shows "Use Web Bluetooth?" prompt
3. **User clicks**: Browser permission dialog appears
4. **Permission granted**: Web Bluetooth scanning starts
5. **Messages received**: Via BLE advertisements from other devices

## Manual Activation

Add a button to your UI:

```tsx
<button onClick={() => network.initWebBluetooth()}>
  🌐 Use Web Bluetooth
</button>
```

## Advertising (Sending Messages)

**Status:** Experimental - requires Chrome flag

**Enable:**
```
chrome://flags/#enable-experimental-web-platform-features
```

**Limitations:**
- May not work on all Windows devices
- Bluetooth adapter dependent
- Background advertising not supported

## Testing

### Verify Web Bluetooth Support

Open browser console:
```javascript
if ('bluetooth' in navigator) {
  console.log('✅ Web Bluetooth supported');
} else {
  console.log('❌ Web Bluetooth NOT supported');
}
```

### Test Scanning

```javascript
navigator.bluetooth.requestDevice({
  acceptAllDevices: true
}).then(device => {
  console.log('Device:', device.name);
}).catch(err => {
  console.error('Error:', err);
});
```

## Troubleshooting

### "Web Bluetooth not supported"

- Update to Chrome 90+
- Check `chrome://flags/#enable-web-bluetooth`
- Some features require HTTPS

### "User cancelled device selection"

- User must actively select a device
- Cannot scan in background without user action

### Advertising not working

1. Enable experimental features flag
2. Check Bluetooth adapter compatibility
3. Try on different device (some adapters don't support it)

### Permission denied

- User must grant permission on each session
- Cannot persist across page reloads in some browsers

## Performance

**Scanning:**
- ✅ Efficient, low battery impact
- ✅ Detects nearby devices quickly

**Advertising:**
- ⚠️ Experimental, may drain battery faster
- ⚠️ Limited range compared to native

## Production Deployment

For production mesh network on Windows:

**Recommended Approach:**
1. **Web UI**: Use Web Bluetooth for browser-based access
2. **Native App**: Package with Electron + Windows drivers
3. **Hybrid**: Detect platform and use appropriate method

**Not Recommended:**
- Relying solely on Web Bluetooth advertising (experimental)
- Background mesh operation (browser tabs can be suspended)

## Platform Comparison

| Platform | Best Solution |
|----------|--------------|
| **Windows** | Web Bluetooth (scanning) or Electron app |
| **macOS** | Native Node.js + @abandonware/noble |
| **Linux** | Native Node.js + BlueZ |
| **Android** | Web Bluetooth or React Native |
| **iOS** | Web Bluetooth or React Native |

## Next Steps

- See [WINDOWS-SETUP.md](WINDOWS-SETUP.md) for native alternatives
- Check [USER_GUIDE.md](USER_GUIDE.md) for usage
- Review [IMPLEMENTATION.md](IMPLEMENTATION.md) for technical details

## Resources

- [Web Bluetooth Spec](https://webbluetoothcg.github.io/web-bluetooth/)
- [Chrome Web Bluetooth](https://developer.chrome.com/docs/capabilities/bluetooth)
- [Can I Use Web Bluetooth](https://caniuse.com/web-bluetooth)
