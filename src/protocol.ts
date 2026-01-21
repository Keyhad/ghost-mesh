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
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
