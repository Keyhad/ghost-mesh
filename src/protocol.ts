/**
 * Message format for ghost-mesh
 * Uses phone numbers as routing IDs and supports auto-relay
 */

export interface Message {
  // Destination phone number (e.g., "+1234567890")
  to: string;
  // Sender phone number
  from: string;
  // Message content
  content: string;
  // Unique message ID to prevent relay loops
  id: string;
  // Timestamp
  timestamp: number;
  // Hop count for relay limiting
  hops: number;
}

export const MAX_HOPS = 10;
export const MESSAGE_VERSION = 1;

/**
 * Serialize a message to a Buffer for BLE transmission
 */
export function serializeMessage(message: Message): Buffer {
  const data = {
    v: MESSAGE_VERSION,
    t: message.to,
    f: message.from,
    c: message.content,
    i: message.id,
    ts: message.timestamp,
    h: message.hops
  };
  return Buffer.from(JSON.stringify(data), 'utf-8');
}

/**
 * Deserialize a Buffer back to a Message
 */
export function deserializeMessage(buffer: Buffer): Message | null {
  try {
    const data = JSON.parse(buffer.toString('utf-8'));
    if (data.v !== MESSAGE_VERSION) {
      return null;
    }
    return {
      to: data.t,
      from: data.f,
      content: data.c,
      id: data.i,
      timestamp: data.ts,
      hops: data.h
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Check if a phone number matches the destination
 * Uses direct byte-matching for privacy
 */
export function phoneNumberMatches(phoneNumber: string, destination: string): boolean {
  // Normalize phone numbers by removing spaces, dashes, and parentheses
  const normalize = (num: string) => num.replace(/[\s\-\(\)]/g, '');
  return normalize(phoneNumber) === normalize(destination);
}

/**
 * Message types for compact encoding
 */
export enum MessageType {
  SOS = 0x01,
  TEXT = 0x02,
  GPS = 0x03,
  BROADCAST = 0xFF
}

/**
 * Encode message to compact manufacturer data format (27 bytes)
 * Format:
 * - Bytes 0-1: Company ID (0xFFFF)
 * - Bytes 2-9: Message ID (timestamp as 8-byte uint)
 * - Bytes 10-13: From phone (last 4 digits as uint32)
 * - Bytes 14-17: To phone (last 4 digits as uint32)
 * - Byte 18: Message type (SOS=0x01, TEXT=0x02, GPS=0x03, BROADCAST=0xFF)
 * - Byte 19: Hops (0-255)
 * - Bytes 20-23: GPS Latitude (float32)
 * - Bytes 24-26: GPS Longitude (compressed to 3 bytes)
 */
export function encodeToManufacturerData(message: Message): Buffer {
  const buffer = Buffer.alloc(27);

  // Company ID (0xFFFF = custom/test)
  buffer.writeUInt16LE(0xFFFF, 0);

  // Message ID (use timestamp as unique ID)
  const msgId = BigInt(message.id.split('-')[0] || message.timestamp);
  buffer.writeBigUInt64LE(msgId, 2);

  // Phone numbers (last 4 digits only for privacy and space)
  const fromDigits = parseInt(message.from.replace(/\D/g, '').slice(-4)) || 0;
  const toDigits = message.to === 'BROADCAST' ? 0xFFFFFFFF :
                   parseInt(message.to.replace(/\D/g, '').slice(-4)) || 0;
  buffer.writeUInt32LE(fromDigits, 10);
  buffer.writeUInt32LE(toDigits, 14);

  // Message type detection
  let messageType = MessageType.TEXT;
  if (message.to === 'BROADCAST') {
    messageType = MessageType.BROADCAST;
  } else if (message.content.includes('🆘') || message.content.toUpperCase().includes('SOS')) {
    messageType = MessageType.SOS;
  } else if (message.content.includes('GPS:')) {
    messageType = MessageType.GPS;
  }
  buffer.writeUInt8(messageType, 18);

  // Hops
  buffer.writeUInt8(Math.min(message.hops, 255), 19);

  // GPS coordinates (if present in content)
  const gpsMatch = message.content.match(/GPS:\s*([-\d.]+),\s*([-\d.]+)/);
  if (gpsMatch) {
    const lat = parseFloat(gpsMatch[1]);
    const lon = parseFloat(gpsMatch[2]);

    // Latitude as 4-byte float
    buffer.writeFloatLE(lat, 20);

    // Longitude compressed to 3 bytes (24-bit)
    // Range: -180 to +180 → 0 to 360 → 0 to 16,777,215
    // Resolution: ~0.000021 degrees (~2.4 meters at equator)
    const lonCompressed = Math.round((lon + 180) * 46603.7);
    buffer.writeUIntLE(Math.max(0, Math.min(0xFFFFFF, lonCompressed)), 24, 3);
  } else {
    // No GPS - fill with zeros
    buffer.fill(0, 20, 27);
  }

  return buffer;
}

/**
 * Decode manufacturer data back to Message
 */
export function decodeFromManufacturerData(data: Buffer): Message | null {
  try {
    // Validate minimum length and company ID
    if (data.length < 20) return null;

    const companyId = data.readUInt16LE(0);
    if (companyId !== 0xFFFF) return null;

    // Extract fields
    const timestamp = Number(data.readBigUInt64LE(2));
    const fromDigits = data.readUInt32LE(10).toString().padStart(4, '0');
    const toDigits = data.readUInt32LE(14);
    const messageType = data.readUInt8(18) as MessageType;
    const hops = data.readUInt8(19);

    // Reconstruct phone numbers (partial - last 4 digits)
    const from = `***${fromDigits}`;
    const to = toDigits === 0xFFFFFFFF ? 'BROADCAST' : `***${toDigits.toString().padStart(4, '0')}`;

    // Build message content based on type
    let content = '';
    switch (messageType) {
      case MessageType.SOS:
        content = '🆘 SOS Emergency!';
        break;
      case MessageType.GPS:
        content = 'GPS Location';
        break;
      case MessageType.BROADCAST:
        content = 'Broadcast Message';
        break;
      default:
        content = 'Message';
    }

    // Decode GPS if available
    if (data.length >= 27 && !data.slice(20, 27).every(b => b === 0)) {
      const lat = data.readFloatLE(20);
      const lonCompressed = data.readUIntLE(24, 3);
      const lon = (lonCompressed / 46603.7) - 180;

      if (lat !== 0 || lon !== -180) {
        content += ` GPS: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      }
    }

    // Generate message ID from timestamp
    const id = `${timestamp}-mfg`;

    return {
      id,
      from,
      to,
      content,
      timestamp,
      hops
    };
  } catch (error) {
    return null;
  }
}
