# Ghost-Mesh Protocol Specification

## Address Format

### Why 5 Bytes for Phone Numbers?

We store phone numbers as **raw integers** (not floats or hashes) to keep the system intuitive and avoid corruption.

**The Math:**

- **4 Bytes (32-bit)**: Can only hold up to $4,294,967,295$ (too small for many phone numbers)
- **5 Bytes (40-bit)**: Can hold up to $1,099,511,627,775$ (1+ trillion)

Since 1 trillion exceeds any 10-digit phone number, **5 bytes is the optimal size** to store raw phone numbers without hashing.

### Why Not Float?

A 32-bit float only has ~7 digits of precision. If you store `5551234567` as a float, it will round and corrupt the last digits—sending your message to the wrong person!

## Packet Structure

### Base Packet Format (31 bytes total)

| Field     | Size     | Purpose                                       |
| --------- | -------- | --------------------------------------------- |
| DST ID    | 5 bytes  | Destination phone number (as integer)         |
| SRC ID    | 5 bytes  | Source phone number (as integer)              |
| MSG ID    | 2 bytes  | Message ID (12 bits) + Packet Number (4 bits) |
| HOP COUNT | 1 byte   | Hop counter (counts DOWN from 255 to 0)       |
| DATA      | 18 bytes | Actual message content                        |

### MSG ID Breakdown (2 bytes = 16 bits)

```
Bits 15-4: Message ID (12 bits) = 4,096 unique message IDs
Bits 3-0:  Packet Number (4 bits) = 0-15 packets per message
```

- **Message ID** (12 bits): Unique identifier to prevent loops, 4,096 possible IDs
- **Packet Number** (4 bits): For multi-packet messages, 0-15 (max 16 packets)

### HOP COUNT Byte (1 byte = 8 bits)

```
Value: 0-255 (counts DOWN to zero)
```

- **Initial Value**: Set to maximum hops allowed (e.g., 255, 100, or custom)
- **Relay Behavior**: Each relay node decrements by 1 before forwarding
- **Drop Condition**: When HOP COUNT reaches 0, packet is NOT relayed further
- **Benefit**: Prevents infinite loops and provides flexible hop limits

## Message Priority System

Messages are routed based on priority levels:

### 1. **SOS/Help Signal** (Highest Priority)

- Emergency messages get absolute priority in relay jumps
- Will be forwarded first when multiple messages are queued
- Special flag in packet structure to identify SOS

### 2. **Direct Messages** (Medium Priority)

- Standard peer-to-peer messages
- Normal relay behavior

### 3. **Broadcast Messages** (Lowest Priority)

- Messages sent to all nodes
- Lower priority than direct or SOS messages
- May be delayed if higher priority messages are pending

## Multi-Packet Messages

### Constraints

- **Max Data Frame**: 18 bytes per packet
- **Max Packets per Message**: 16 packets (Packet Number 0-15)
- **Packet Number**: Stored in MSG ID lower 4 bits, incremental (0-15)
- **Message ID**: Upper 12 bits of MSG ID field, 4,096 unique values

### Packetization Rules

1. If message > 18 bytes, split into multiple packets (max 16)
2. Generate unique 12-bit Message ID (bits 15-4 of MSG ID field)
3. Each packet gets sequential Packet Number (bits 3-0 of MSG ID field): 0, 1, 2, ..., 15
4. All packets in same message share the same 12-bit Message ID
5. Receiver reassembles by:
   - Grouping packets with same Message ID (upper 12 bits)
   - Sorting by Packet Number (lower 4 bits)
   - Concatenating DATA fields in order

### Example: 40-byte Message

Message ID = 2560 (binary: 1010_0000_0000)

```plain
Packet 0: Bytes 0-17   (MSG ID = 2560 | 0 = 0xA000)
Packet 1: Bytes 18-35  (MSG ID = 2560 | 1 = 0xA001)
Packet 2: Bytes 36-39  (MSG ID = 2560 | 2 = 0xA002, partial)
```

All three packets share Message ID 2560 (0xA00), but have different Packet Numbers (0, 1, 2).

### Transmission Cooldown

**Users cannot send a new long message for a period of time** to ensure:

- Old messages have time to propagate through the mesh
- Prevents network congestion from single user
- Ensures reliable delivery before sending next multi-packet message

**Recommended Cooldown**: ~10-30 seconds after last packet sent

## Message ID Generation

- **12 bits** for Message ID = 4,096 unique IDs
- **4 bits** for Packet Number = 0-15 packets
- Message ID should be unique enough to prevent collisions during propagation time
- Recommended: Use lower 12 bits of (timestamp + random) or sequential counter
- Packet Number is set per packet (0 for first, 1 for second, etc.)

## Best Practices

### For Users

1. **Keep messages short** (≤18 bytes) whenever possible
2. Avoid sending long messages frequently
3. Use SOS flag only for genuine emergencies
4. Wait for cooldown period before sending next long message

### For Implementation

1. Validate phone numbers fit in 5 bytes before transmission
2. Implement proper message queue with priority sorting
3. Track seen MSG IDs to prevent loops
4. Enforce packet count limit (max 15 packets)
5. Implement transmission cooldown timer for multi-packet messages

## Example Scenarios

### Single Packet Message (18 bytes or less)

```plain
DST: 1234567890 (5 bytes)
SRC: 9876543210 (5 bytes)
MSG ID: 0x1230 (msg_id=0x123, packet=0)
HOP COUNT: 255 (starts at max, decrements each relay)
DATA: "Help at Main St" (15 bytes, padded to 18)
```

### Multi-Packet Message (40 bytes)

```plain
Packet 0:
  DST: 1234567890
  SRC: 9876543210
  MSG ID: 0xABC0 (msg_id=0xABC, packet=0)
  HOP COUNT: 255
  DATA: First 18 bytes

Packet 1:
  DST: 1234567890
  SRC: 9876543210
  MSG ID: 0xABC1 (msg_id=0xABC, packet=1)
  HOP COUNT: 255
  DATA: Next 18 bytes

Packet 2:
  DST: 1234567890
  SRC: 9876543210
  MSG ID: 0xABC2 (msg_id=0xABC, packet=2)
  HOP COUNT: 255
  DATA: Last 4 bytes + padding
```

Note: All packets have same upper 12 bits (0xABC) but different lower 4 bits (0, 1, 2).

### SOS Priority Message

```plain
DST: BROADCAST (0xFFFFFFFFFF)
SRC: 5551234567
MSG ID: 0xFFF0 (msg_id=0xFFF for SOS, packet=0)
HOP COUNT: 255 (maximum propagation)
DATA: "SOS - injured"
```

Note: SOS messages use special Message ID range (e.g., 0xF00-0xFFF) for priority identification.

## SOS Position Determination

Emergency messages require location information to dispatch help effectively. The mesh network can determine SOS sender position using multiple methods.

### Method 1: GPS Coordinates in Payload (Most Accurate)

If the sender has GPS available, encode coordinates directly in the DATA field.

**Encoding Format** (10 bytes):

```plain
Latitude:  4 bytes (float32) = ±90°  with ~1m precision
Longitude: 4 bytes (float32) = ±180° with ~1m precision
Accuracy:  2 bytes (uint16)  = GPS accuracy in meters (0-65535m)
```

**Example SOS with GPS:**

```plain
DST: BROADCAST (0xFFFFFFFFFF)
SRC: 5551234567
MSG ID: 0xFFF0
HOP COUNT: 255
DATA: [GPS_LAT][GPS_LON][ACCURACY]"SOS" (10 bytes GPS + 3 bytes text)
```

**Calculation:**

```plain
Latitude  = 37.7749 (San Francisco)
  → bytes: 0x42 0x17 0x63 0x8F
Longitude = -122.4194
  → bytes: 0xC2 0xF4 0x6B 0x5C
Accuracy  = 15 meters
  → bytes: 0x00 0x0F

Total: 10 bytes, leaving 8 bytes for message text
```

### Method 2: RSSI-Based Trilateration (Fallback)

When GPS is unavailable, use Received Signal Strength Indicator (RSSI) from multiple relay nodes to estimate position.

**Requirements:**

- Minimum 3 relay nodes with known positions
- Each relay node records RSSI when receiving SOS packet
- Relay nodes send their position + RSSI back to a coordinator

**RSSI to Distance Formula:**

The path loss model:
$$d = 10^{\frac{RSSI_{measured} - RSSI_{ref}}{10 \cdot n}}$$

Where:

- $d$ = distance in meters
- $RSSI_{measured}$ = measured signal strength (dBm)
- $RSSI_{ref}$ = reference RSSI at 1 meter (typically -50 to -60 dBm)
- $n$ = path loss exponent (2-4, typically 2.5 for indoor, 2 for outdoor)

**Example Calculation:**

Given:

- $RSSI_{ref} = -55$ dBm (measured at 1m)
- $n = 2.5$ (indoor environment)
- Node A measures: $RSSI = -75$ dBm
- Node B measures: $RSSI = -68$ dBm
- Node C measures: $RSSI = -82$ dBm

Calculate distances:

**Node A:**
$$d_A = 10^{\frac{-75 - (-55)}{10 \cdot 2.5}} = 10^{\frac{-20}{25}} = 10^{-0.8} ≈ 0.158 \times 10 = 15.8m$$

**Node B:**
$$d_B = 10^{\frac{-68 - (-55)}{25}} = 10^{-0.52} ≈ 10.0m$$

**Node C:**
$$d_C = 10^{\frac{-82 - (-55)}{25}} = 10^{-1.08} ≈ 31.6m$$

**Trilateration (2D):**

Given node positions:

- Node A: $(x_A, y_A)$ at distance $d_A$
- Node B: $(x_B, y_B)$ at distance $d_B$
- Node C: $(x_C, y_C)$ at distance $d_C$

Solve system of equations:
$$(x - x_A)^2 + (y - y_A)^2 = d_A^2$$
$$(x - x_B)^2 + (y - y_B)^2 = d_B^2$$
$$(x - x_C)^2 + (y - y_C)^2 = d_C^2$$

**Linearized solution:**

$$x = \frac{1}{2D} \left[ (d_A^2 - d_B^2) - (x_A^2 + y_A^2) + (x_B^2 + y_B^2) \right]$$
$$y = \frac{1}{2D} \left[ (d_A^2 - d_C^2) - (x_A^2 + y_A^2) + (x_C^2 + y_C^2) \right]$$

Where:
$$D = 2[(x_A - x_B)(y_A - y_C) - (x_A - x_C)(y_A - y_B)]$$

### Method 3: Hop-Based Distance Estimation (Rough)

Use hop count as a crude distance metric when no other method is available.

**Assumptions:**

- Average BLE range: 50-100 meters
- Each hop ≈ 75 meters (midpoint estimate)

**Formula:**
$$Distance_{estimated} = (HOP_{initial} - HOP_{current}) \times 75m$$

**Example:**

```plain
SOS sent with HOP COUNT = 255
Node receives with HOP COUNT = 250
Hops traveled = 255 - 250 = 5 hops
Estimated distance ≈ 5 × 75m = 375 meters
```

**Limitations:**

- Very approximate (±50% error)
- Only provides radius, not direction
- Useful for "rough proximity" only

### Method 4: Hybrid Approach (Recommended)

Combine multiple methods for best accuracy:

1. **Primary**: Use GPS if available (±5-15m accuracy)
2. **Fallback**: RSSI trilateration if 3+ nodes with known positions (±10-50m)
3. **Last Resort**: Hop count estimation (±100-500m)

**SOS Data Packet Priority:**

```plain
Byte 0: Location Type (0=none, 1=GPS, 2=RSSI, 3=hop-based)
Bytes 1-10: Location data (format depends on type)
Bytes 11-17: Message text (7 bytes)
```

### Implementation Checklist

**For SOS Sender:**

- [ ] Check GPS availability
- [ ] If GPS: Encode lat/lon/accuracy in first 10 bytes
- [ ] If no GPS: Set location type = 0, let receivers use RSSI
- [ ] Use MSG ID 0xF00-0xFFF range
- [ ] Set HOP COUNT to 255 (maximum propagation)

**For Relay Nodes:**

- [ ] Record RSSI when receiving SOS packet
- [ ] If own position is known: Report (position, RSSI) to coordinator
- [ ] Forward SOS with highest priority (queue jump)
- [ ] Log timestamp and SOS sender phone number

**For Coordinator/Receiver:**

- [ ] If GPS in packet: Extract and display coordinates
- [ ] If no GPS: Collect RSSI reports from ≥3 nodes
- [ ] Run trilateration algorithm
- [ ] Display estimated position with confidence radius
- [ ] If insufficient data: Show "within X hops" estimate

### Accuracy Comparison

| Method          | Typical Accuracy | Requirements            | Latency |
| --------------- | ---------------- | ----------------------- | ------- |
| GPS             | ±5-15m           | GPS signal, clear sky   | Instant |
| RSSI (3 nodes)  | ±10-50m          | 3+ nodes with known pos | 2-5 sec |
| RSSI (5+ nodes) | ±5-30m           | 5+ nodes with known pos | 3-8 sec |
| Hop count       | ±100-500m        | None                    | Instant |

## Technical Constraints

- **BLE MTU**: Typically 23-185 bytes (depends on device)
- **Packet Overhead**: 13 bytes (DST 5 + SRC 5 + MSG ID 2 + HOP COUNT 1)
- **Usable Data**: 18 bytes per packet
- **Max Message Size**: 288 bytes (16 packets × 18 bytes)
- **Hop Limit**: 0-255 (configurable, counts down to 0)
- **Message ID Space**: 4,096 unique message IDs (12 bits)
- **Packet Numbers**: 0-15 per message (4 bits)
- **Phone Number Limit**: 10 digits (fits in 5 bytes)

## Hop Count Behavior

### Initialization

- Sender sets HOP COUNT to maximum allowed value (typically 255, or configurable like 100, 50, etc.)

### Relay Process

1. Node receives packet
2. Checks if HOP COUNT > 0
3. If yes: Decrements HOP COUNT by 1 and forwards
4. If HOP COUNT = 0: Drops packet (no further relay)

### Benefits

- **Flexible Range**: 0-255 hops vs previous 0-15 limit
- **Natural Expiration**: Messages automatically stop propagating
- **No Additional Storage**: Simple decrement operation
- **Loop Prevention**: Combined with Message ID tracking
