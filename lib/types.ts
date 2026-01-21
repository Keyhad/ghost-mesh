export interface Message {
  id: string;
  srcId: string; // Source phone number
  dstId: string; // Destination phone number
  content: string;
  timestamp: number;
  hops: string[]; // Track which devices the message has visited
  ttl: number; // Time to live / max hops
}

export interface Device {
  id: string; // Phone number
  peerId: string; // WebRTC peer ID
  lastSeen: number;
  connected: boolean;
}

export interface Contact {
  phoneNumber: string;
  name: string;
}

export interface MessageStatus {
  messageId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  timestamp: number;
}
