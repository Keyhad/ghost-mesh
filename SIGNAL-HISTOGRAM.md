# Signal Strength Histogram - BLE Device Visualization

## Overview

The Signal Histogram Card provides real-time visualization of BLE device signal strength distribution using an interactive histogram chart.

## Features

### 📊 Histogram Chart
- **5 Signal Strength Buckets**:
  - **Excellent** (-30 to -50 dBm): Very close devices, strong signal - Green
  - **Good** (-50 to -60 dBm): Close proximity, good connection - Blue
  - **Fair** (-60 to -70 dBm): Medium distance, acceptable - Amber
  - **Weak** (-70 to -80 dBm): Far away, unstable - Red
  - **Very Weak** (< -80 dBm): At edge of range - Dark Red

### 📈 Real-Time Statistics
- **Average RSSI**: Mean signal strength across all active devices
- **Strongest Signal**: Best (highest) RSSI value
- **Weakest Signal**: Worst (lowest) RSSI value

### 🎨 Visual Features
- Color-coded bars by signal quality
- Gradient fills for visual appeal
- Device count labels on each bar
- Interactive legend with descriptions
- Auto-scaling based on device count

## Understanding RSSI (Received Signal Strength Indicator)

### What is RSSI?
RSSI measures the power of received radio signal, expressed in dBm (decibels relative to milliwatt). It indicates how strong the signal is between your device and the BLE peripheral.

### RSSI Scale
```
Stronger ← → Weaker
-30 dBm ... -100 dBm

-30 to -50:  Excellent (very close, < 1 meter)
-50 to -60:  Good (close, 1-5 meters)
-60 to -70:  Fair (medium, 5-15 meters)
-70 to -80:  Weak (far, 15-25 meters)
-80 to -100: Very Weak (edge of range, > 25 meters)
```

### Factors Affecting RSSI
1. **Distance**: Primary factor - closer = stronger signal
2. **Obstacles**: Walls, furniture, people reduce signal
3. **Interference**: Other wireless devices, microwaves
4. **Orientation**: Antenna positioning matters
5. **Device Type**: Different BLE chipsets have different power

## How It Works

### Data Flow
```
BLE Device → noble scanner → MeshNode → WebSocket → UI → Histogram
     ↓           ↓             ↓          ↓        ↓       ↓
  RSSI       peripheral    deviceInfo   event   Device   Chart
```

### Data Structure
```typescript
interface Device {
  id: string;
  rssi: number;          // Signal strength in dBm
  connected: boolean;     // Active status
  activityCount: number;  // Times seen
  lastSeen: number;      // Timestamp
}
```

### Histogram Calculation
1. **Filter Active Devices**: Only show connected devices with RSSI
2. **Bucket Sorting**: Place each device into appropriate strength range
3. **Count**: Tally devices per bucket
4. **Scale**: Normalize bar heights to max count
5. **Render**: Draw bars with colors and labels

## Usage

### In the UI
1. Open GhostMesh web interface
2. Initialize your node
3. Click "Signal Strength" card to expand
4. View real-time histogram as devices are discovered

### Interpreting the Chart

#### Example 1: Office Environment
```
Excellent: 2 devices  (coworker's phones nearby)
Good:      5 devices  (same room)
Fair:      8 devices  (adjacent rooms)
Weak:      3 devices  (far offices)
Very Weak: 1 device   (different floor)
```
**Interpretation**: Good BLE coverage, mostly nearby devices

#### Example 2: Public Space
```
Excellent: 1 device   (your phone)
Good:      3 devices  (people at same table)
Fair:      12 devices (people in area)
Weak:      15 devices (people further away)
Very Weak: 8 devices  (edge of scan range)
```
**Interpretation**: High device density, typical for coffee shop

#### Example 3: Home
```
Excellent: 3 devices  (your devices)
Good:      2 devices  (same room)
Fair:      1 device   (different room)
Weak:      0 devices
Very Weak: 0 devices
```
**Interpretation**: Low density, good signal quality

## Technical Details

### Canvas Rendering
- Uses HTML5 Canvas for hardware-accelerated rendering
- Scales with device pixel ratio for sharp display
- Gradient fills for professional appearance
- Dynamic sizing based on container

### Performance
- Redraws on device list changes
- Efficient bucket sorting (O(n) where n = device count)
- Minimal DOM manipulation
- Smooth animations via canvas

### Color Scheme
```css
Excellent: #10b981 (emerald-500)
Good:      #3b82f6 (blue-500)
Fair:      #f59e0b (amber-500)
Weak:      #ef4444 (red-500)
Very Weak: #991b1b (red-900)
```

## Use Cases

### 1. Device Proximity Detection
- See which devices are closest
- Identify devices moving in/out of range
- Monitor signal strength changes over time

### 2. Coverage Analysis
- Assess BLE coverage in an area
- Identify signal dead zones
- Plan device placement

### 3. Mesh Network Health
- Monitor overall network connectivity
- Identify weak links
- Optimize node positioning

### 4. Device Tracking
- Track device movement by signal changes
- Detect when devices leave area
- Measure connection stability

## Future Enhancements

### Potential Additions
- [ ] Time-series signal strength graph per device
- [ ] Signal strength heatmap
- [ ] Alert for devices with degrading signal
- [ ] Export signal data as CSV
- [ ] Filter histogram by device name/type
- [ ] Show individual device RSSI on hover
- [ ] Compare signal strength between two devices
- [ ] Signal quality score (composite metric)

### Advanced Features
- [ ] Predictive signal loss warnings
- [ ] Optimal relay node suggestions
- [ ] Signal strength-based device grouping
- [ ] Historical signal trends
- [ ] Signal quality vs distance correlation

## Troubleshooting

### No Data Showing
- **Issue**: Empty histogram
- **Cause**: No active devices or missing RSSI data
- **Fix**: Ensure BLE scanning is active and devices are in range

### All Devices in One Bucket
- **Issue**: Histogram only shows one bar
- **Cause**: All devices have similar signal strength
- **Fix**: Normal if all devices are at same distance

### Flickering Bars
- **Issue**: Bars changing height rapidly
- **Cause**: Devices moving or signal fluctuation
- **Fix**: Normal behavior, shows real-time changes

### Wrong RSSI Values
- **Issue**: Unexpected signal readings
- **Cause**: Different BLE hardware reports RSSI differently
- **Fix**: Values are relative, compare trends not absolutes

## References

- [Bluetooth SIG - RSSI](https://www.bluetooth.com/specifications/specs/)
- [BLE Signal Strength Guide](https://www.bluetooth.com/learn-about-bluetooth/tech-overview/)
- [HTML5 Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
