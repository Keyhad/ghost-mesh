/**
 * Tests for protocol layer
 */

import {
  Message,
  serializeMessage,
  deserializeMessage,
  generateMessageId,
  phoneNumberMatches,
  MAX_HOPS,
  MESSAGE_VERSION
} from '../protocol';

describe('Protocol', () => {
  describe('Message Serialization', () => {
    it('should serialize and deserialize a message correctly', () => {
      const message: Message = {
        to: '+1234567890',
        from: '+0987654321',
        content: 'Hello, World!',
        id: 'test-id-123',
        timestamp: Date.now(),
        hops: 0
      };

      const buffer = serializeMessage(message);
      const deserialized = deserializeMessage(buffer);

      expect(deserialized).not.toBeNull();
      expect(deserialized?.to).toBe(message.to);
      expect(deserialized?.from).toBe(message.from);
      expect(deserialized?.content).toBe(message.content);
      expect(deserialized?.id).toBe(message.id);
      expect(deserialized?.timestamp).toBe(message.timestamp);
      expect(deserialized?.hops).toBe(message.hops);
    });

    it('should handle invalid buffers gracefully', () => {
      const invalidBuffer = Buffer.from('not valid json');
      const result = deserializeMessage(invalidBuffer);
      expect(result).toBeNull();
    });

    it('should reject messages with wrong version', () => {
      const wrongVersion = {
        v: 999,
        t: '+1234567890',
        f: '+0987654321',
        c: 'test',
        i: 'id',
        ts: Date.now(),
        h: 0
      };
      const buffer = Buffer.from(JSON.stringify(wrongVersion));
      const result = deserializeMessage(buffer);
      expect(result).toBeNull();
    });
  });

  describe('Message ID Generation', () => {
    it('should generate unique message IDs', () => {
      const id1 = generateMessageId();
      const id2 = generateMessageId();
      expect(id1).not.toBe(id2);
    });

    it('should generate non-empty IDs', () => {
      const id = generateMessageId();
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('Phone Number Matching', () => {
    it('should match identical phone numbers', () => {
      expect(phoneNumberMatches('+1234567890', '+1234567890')).toBe(true);
    });

    it('should match phone numbers with different formatting', () => {
      expect(phoneNumberMatches('+1 (234) 567-890', '+1234567890')).toBe(true);
      expect(phoneNumberMatches('+1-234-567-890', '+1234567890')).toBe(true);
      expect(phoneNumberMatches('+1 234 567 890', '+1234567890')).toBe(true);
    });

    it('should not match different phone numbers', () => {
      expect(phoneNumberMatches('+1234567890', '+0987654321')).toBe(false);
    });

    it('should handle phone numbers without country code', () => {
      expect(phoneNumberMatches('1234567890', '1234567890')).toBe(true);
    });
  });

  describe('Constants', () => {
    it('should have correct MAX_HOPS value', () => {
      expect(MAX_HOPS).toBe(10);
    });

    it('should have correct MESSAGE_VERSION', () => {
      expect(MESSAGE_VERSION).toBe(1);
    });
  });
});
