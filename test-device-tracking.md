# Device Tracking with Keep-Alive - Feature Overview

## What's New

The BLE mesh network now includes intelligent device tracking with automatic cleanup:

### 1. **Device Lifecycle States**
- **New**: First time seeing a device
- **Active**: Device seen within last 10 seconds
- **Inactive**: No activity for 10-30 seconds (marked but not removed)
- **Removed**: No activity for 30+ seconds (removed from list)

### 2. **Automatic Cleanup**
- Devices are checked every 5 seconds
- Inactive devices (10s) are marked as "inactive" but kept in list
- Timed-out devices (30s) are automatically removed
- Prevents stale device list when devices go out of range

### 3. **Enhanced Device Information**
Each device now tracks:
- `id`: Unique device identifier
- `lastSeen`: Timestamp of last activity
- `rssi`: Signal strength (Received Signal Strength Indicator)
- `isActive`: Boolean flag for active status
- `activityCount`: Number of times device has been seen
- `status`: Current lifecycle state

### 4. **New Events**

**From Mesh Node:**
- `deviceDiscovered` - New device or reactivated device
- `deviceHeartbeat` - Periodic signal from active devices
- `deviceInactive` - Device hasn't been seen recently
- `devicesUpdated` - Device list changed (removals)

**WebSocket Server Events:**
- `device_update` - Single device status change
- `device_removed` - Devices removed from tracking
- `devices_list` - Full device list (on request)

### 5. **Configuration**
```typescript
const DEVICE_TIMEOUT_MS = 30000;          // 30s - device removed
const DEVICE_CLEANUP_INTERVAL_MS = 5000;  // Check every 5s
const DEVICE_ACTIVE_THRESHOLD_MS = 10000; // 10s - recent activity
```

## Usage

### Get Current Device List
```javascript
// Send via WebSocket
{
  type: 'get_devices'
}

// Response
{
  type: 'devices_list',
  devices: [
    {
      id: 'aa:bb:cc:dd:ee:ff',
      lastSeen: 1737648123456,
      rssi: -65,
      isActive: true,
      activityCount: 42,
      status: 'active'
    }
  ],
  activeCount: 5,
  totalCount: 8
}
```

### Monitor Device Changes
```javascript
// New device discovered
{
  type: 'device_update',
  device: { id: '...', status: 'new', isActive: true, ... },
  activeCount: 6
}

// Device went inactive
{
  type: 'device_update',
  device: { id: '...', status: 'inactive', isActive: false, ... }
}

// Devices removed (timeout)
{
  type: 'device_removed',
  devices: [{ id: '...', status: 'removed', ... }],
  activeCount: 4,
  totalCount: 6
}
```

## Benefits

1. **Realistic Device List**: Only shows devices that are actually in range
2. **Automatic Cleanup**: No manual intervention needed
3. **Status Awareness**: UI can show active vs inactive devices
4. **Memory Efficient**: Prevents unbounded growth of device list
5. **Better UX**: Users see which devices are currently reachable

## Testing

To test the keep-alive mechanism:

1. Start the mesh network
2. Observe devices being discovered
3. Move a device out of range or turn it off
4. After 10 seconds: Device marked "inactive"
5. After 30 seconds: Device removed from list
6. Bring device back in range: Reappears as "active"

## Example Scenario

```
| Time  | Event                        | Active | Total |
| ----- | ---------------------------- | ------ | ----- |
| 00:00 | Device A discovered          | 1      | 1     |
| 00:05 | Device B discovered          | 2      | 2     |
| 00:10 | Device C discovered          | 3      | 3     |
| 00:15 | Device A moved out of range  | 3      | 3     |
| 00:25 | Device A marked inactive     | 2      | 3     |
| 00:45 | Device A removed (timeout)   | 2      | 2     |
| 01:00 | Device A back in range (new) | 3      | 3     |
```

## Implementation Details

The keep-alive mechanism uses three time thresholds:

1. **Active Threshold (10s)**: Recent activity indicator
2. **Cleanup Interval (5s)**: How often to check devices
3. **Timeout (30s)**: When to remove stale devices

This provides a good balance between:
- Quick detection of devices leaving range
- Not removing devices too aggressively during brief signal drops
- Keeping the device list manageable and relevant
