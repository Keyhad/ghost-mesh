# Log Level Configuration

## Overview
GhostMesh backend now supports configurable log levels to control logging verbosity.

## Log Levels

| Level | Description | Output |
|-------|-------------|--------|
| `DEBUG` | Most verbose - shows all logs including BLE device details | 🔍 Debug messages + all below |
| `INFO` | Standard operation logs (default) | ℹ️ Info messages + all below |
| `WARN` | Warnings only | ⚠️ Warnings + errors only |
| `ERROR` | Errors only | ❌ Errors only |
| `SILENT` | No logging | (nothing) |

## Usage

### Set via Environment Variable

**Windows (PowerShell):**
```powershell
$env:LOG_LEVEL="debug"; npm run dev:all
$env:LOG_LEVEL="info"; npm run dev:all
$env:LOG_LEVEL="warn"; npm run dev:all
$env:LOG_LEVEL="error"; npm run dev:all
$env:LOG_LEVEL="silent"; npm run dev:all
```

**Windows (CMD):**
```cmd
set LOG_LEVEL=debug && npm run dev:all
set LOG_LEVEL=info && npm run dev:all
set LOG_LEVEL=warn && npm run dev:all
```

**Linux/Mac:**
```bash
LOG_LEVEL=debug npm run dev:all
LOG_LEVEL=info npm run dev:all
LOG_LEVEL=warn npm run dev:all
```

### Modify package.json Scripts

Edit `package.json` to set a default log level:

```json
{
  "scripts": {
    "dev:server": "LOG_LEVEL=info tsx watch server/ble-server.ts",
    "dev:web": "next dev --turbopack",
    "dev:all": "concurrently \"npm run dev:server\" \"npm run dev:web\""
  }
}
```

For Windows, create separate scripts:
```json
{
  "scripts": {
    "dev:server": "set LOG_LEVEL=info&& tsx watch server/ble-server.ts",
    "dev:server:debug": "set LOG_LEVEL=debug&& tsx watch server/ble-server.ts",
    "dev:server:quiet": "set LOG_LEVEL=warn&& tsx watch server/ble-server.ts"
  }
}
```

## Log Types

### Standard Logs
- **Debug** (`logger.debug()`): Detailed debugging information
- **Info** (`logger.info()`): General informational messages
- **Warn** (`logger.warn()`): Warning messages
- **Error** (`logger.error()`): Error messages

### Specialized Logs
- **Success** (`logger.success()`): Success messages (shows at INFO level)
- **BLE** (`logger.ble()`): BLE device discovery (shows at DEBUG level)
- **Message** (`logger.message()`): Message send/receive (shows at INFO level)
- **Connection** (`logger.connection()`): WebSocket connections (shows at INFO level)

## Examples

### Full Verbose Output (DEBUG)
```
🔍 Received command: init
ℹ️  Starting BLE mesh node for +1234567890...
✅ BLE mesh node started: { phoneNumber: '+1234567890' }
📡 BLE Device discovered: { id: 'abc123', rssi: -65, ... }
🔍   Service Data: [{ uuid: '1234...', dataHex: 'ff00...' }]
📬 Message received: msg-123
```

### Standard Output (INFO - default)
```
ℹ️  Starting BLE mesh node for +1234567890...
✅ BLE mesh node started: { phoneNumber: '+1234567890' }
🔌 Web client connected
📬 Message received: msg-123
```

### Minimal Output (WARN)
```
⚠️  WebSocket connection timeout
❌ Failed to initialize mesh node: Bluetooth unavailable
```

### Silent Output (SILENT)
```
(no output)
```

## Recommendations

- **Development**: Use `DEBUG` to see all BLE device discoveries
- **Testing**: Use `INFO` (default) for standard operation logs
- **Production**: Use `WARN` or `ERROR` to reduce noise
- **Debugging BLE Issues**: Use `DEBUG` to see all nearby BLE devices

## Current Implementation

The logger is implemented in:
- `src/logger.ts` - Logger utility class
- `server/ble-server.ts` - Uses logger for all server logs
- `src/mesh.ts` - Uses logger for BLE mesh operations

All `console.log` statements have been replaced with appropriate logger methods.
