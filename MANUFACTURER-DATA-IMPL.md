# Manufacturer Data Implementation - Quick Reference

## What Changed

✅ **Implemented Option 3: Manufacturer Data Workaround**

Your BLE mesh now uses a compact 27-byte manufacturer data format to transmit messages WITHOUT requiring pairing or connections!

## Message Format

**27-Byte Manufacturer Data Layout:**
```
| Bytes | Content                                                      |
| ----- | ------------------------------------------------------------ |
| 0-1   | Company ID (0xFFFF = custom)                                 |
| 2-9   | Message ID (timestamp)                                       |
| 10-13 | From Phone (last 4 digits)                                   |
| 14-17 | To Phone (last 4 digits or 0xFFFFFFFF for broadcast)         |
| 18    | Message Type (0x01=SOS, 0x02=Text, 0x03=GPS, 0xFF=Broadcast) |
| 19    | Hops (0-255)                                                 |
| 20-23 | GPS Latitude (float32)                                       |
| 24-26 | GPS Longitude (compressed 24-bit, ~2.4m precision)           |
```

## Key Features

### ✅ No Pairing Required
- Messages broadcast in advertising packets
- Devices relay without user interaction
- Perfect for emergency scenarios

### ✅ GPS Support
- SOS messages include GPS coordinates
- Latitude: Full float precision
- Longitude: Compressed to 3 bytes (~2.4 meter resolution)

### ✅ Privacy Protection
- Only last 4 digits of phone numbers transmitted
- Full numbers never broadcast over BLE
- Receiving device matches against known contacts

### ✅ Efficient Relay
- Hop counter prevents infinite loops
- Duplicate detection with message IDs
- Priority rotation (SOS messages more frequent)

## Testing

### On nRF Connect Mobile App
1. Open nRF Connect on iPhone/Android
2. Tap **SCAN**
3. Look for **"GhostMesh"** devices
4. Tap on device → **RAW** tab
5. Find **"Manufacturer data (0xFFFF)"**
6. You'll see 27 hex bytes containing the message!

### Between Two Macs
1. **iMac**: Run `npm run dev:all`
2. **Laptop**: Run `npm run dev:all`
3. **iMac**: Send SOS from web UI
4. **Laptop**: Should see message appear (check console logs)

## Console Output to Look For

**When Advertising:**
```
📡 BLE advertising started - broadcasting messages...
Broadcasting message 1769268... (27 bytes manufacturer data)
```

**When Receiving:**
```
GhostMesh manufacturer data found: 27 bytes
📨 Message received via manufacturer data from <device>: 1769268...
Message details: { from: '***1234', to: '***5678', content: '🆘 SOS Emergency! GPS: 37.7749, -122.4194' }
```

## Message Types

| Type      | Code | Description      | GPS Data |
| --------- | ---- | ---------------- | -------- |
| SOS       | 0x01 | Emergency SOS    | ✅ Yes    |
| Text      | 0x02 | Regular text     | ❌ No     |
| GPS       | 0x03 | Location share   | ✅ Yes    |
| Broadcast | 0xFF | Broadcast to all | Optional |

## Limitations

⚠️ **27-byte payload limit**
- Phone numbers: Only last 4 digits
- Message content: Type indicator only (no actual text yet)
- Solution: Upgrade to CoreBluetooth (Option 1) for 254 bytes

⚠️ **Platform-specific behavior**
- macOS: May need native bindings for full support
- Fallback: Advertises "GhostMesh" name only if manufacturer data fails

⚠️ **No guaranteed delivery**
- Advertising packets can be missed
- Solution: Rotate messages every 500ms to increase chances

## Next Steps

### Immediate (This Week)
1. Test on two devices (laptop + iMac)
2. Verify message relay through 3+ devices
3. Test SOS with actual GPS coordinates
4. Measure latency and reliability

### Short-term (Month 1-2)
1. Add message chunking for longer content
2. Implement priority queuing (SOS first)
3. Add encryption layer (AES-128 fits in 16 bytes)
4. Field test with mobile devices

### Long-term (Month 3-6)
1. Begin CoreBluetooth native addon (Option 1)
2. Expand payload to 254 bytes
3. Add full message content
4. Implement mesh routing optimization

## Troubleshooting

### "GhostMesh" appears but no messages
- Check console for "manufacturer data" logs
- May be using fallback (name-only) advertising
- Try: `sudo node dist/server/ble-server.js` for elevated permissions

### Messages not received on other device
- Verify both devices running same code version
- Check device discovery count in logs
- Ensure devices within 10-30 meter range
- Try scanning with nRF Connect to see raw data

### GPS coordinates showing as 0.0, -180.0
- Message doesn't contain GPS data
- Only SOS messages include GPS (if available)
- Check message content for "GPS: lat, lon" format

## Documentation

See **[BLE-MESH-OPTIONS.md](BLE-MESH-OPTIONS.md)** for:
- Full technical details
- Migration path to CoreBluetooth
- Performance benchmarks
- Security considerations
