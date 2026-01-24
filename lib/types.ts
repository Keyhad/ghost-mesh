export interface Message {
  id: string;
  srcId: string; // Source phone number
  dstId: string; // Destination phone number
  content: string;
  timestamp: number;
  hops: string[]; // Track which devices the message has visited
  ttl: number; // Time to live / max hops
  msgId?: number; // Protocol MSG ID (0xFFF0 for SOS, etc.)
}

export interface Device {
  id: string; // Phone number
  peerId: string; // WebRTC peer ID
  lastSeen: number;
  connected: boolean;
  rssi?: number; // Signal strength (Received Signal Strength Indicator)
  activityCount?: number; // Number of times device has been seen
}

export interface Contact {
  phoneNumber: string;
  name: string;
  isSpecial?: boolean; // For system contacts like Broadcast and SOS
}

export interface MessageStatus {
  messageId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  timestamp: number;
}

export interface SOSLog {
  id: string;
  timestamp: number;
  direction: 'sent' | 'receive';
  fromNumber?: string;
  gpsLocation: string;
  sentTimestamp: string;
  messageId?: string; // Links to raw Message.id for debugging
  payload?: string; // Hex string of binary payload
}
