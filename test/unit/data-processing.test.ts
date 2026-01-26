// Data processing function tests for BLE advertising-based mesh messaging
// Covers manufacturer data encoding/decoding, UUID validation, device parsing, serialization, and matching

import { encodeManufacturerData, decodeManufacturerData, validateServiceUUID, parseDeviceAdvertisement, serializeMessage, deserializeMessage, matchPhoneNumber, matchMessageId } from '../lib/mesh-network';

describe('Data Processing Functions', () => {
  describe('Manufacturer Data Encoding/Decoding', () => {
    it('should encode a message object into manufacturer data buffer', () => {
      const message = {
        id: '123-abc',
        srcId: '65897777',
        dstId: '65890000',
        content: 'hello',
        timestamp: 1234567890,
        hops: ['65897777'],
        ttl: 10,
        msgId: 0xFFF0,
      };
      const buf = encodeManufacturerData(message);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.length).toBeGreaterThan(0);
    });

    it('should decode manufacturer data buffer into a message object', () => {
      const original = {
        id: '456-def',
        srcId: '65891111',
        dstId: '65892222',
        content: 'mesh',
        timestamp: 987654321,
        hops: ['65891111', '65892222'],
        ttl: 8,
        msgId: 0x1001,
      };
      const buf = encodeManufacturerData(original);
      const decoded = decodeManufacturerData(buf);
      expect(decoded).toMatchObject({
        id: original.id,
        srcId: original.srcId,
        dstId: original.dstId,
        content: original.content,
        timestamp: original.timestamp,
        ttl: original.ttl,
        msgId: original.msgId,
      });
      expect(Array.isArray(decoded.hops)).toBe(true);
      expect(decoded.hops.length).toBeGreaterThan(0);
    });

    it('should throw on invalid manufacturer data', () => {
      const badBuf = Buffer.from([0x00, 0x01, 0x02]);
      expect(() => decodeManufacturerData(badBuf)).toThrow();
    });
  });

  describe('Service UUID Validation/Normalization', () => {
    it('should validate a correct 16-bit service UUID', () => {
      expect(validateServiceUUID('1234')).toBe('00001234-0000-1000-8000-00805f9b34fb');
    });

    it('should validate a correct 128-bit service UUID', () => {
      expect(validateServiceUUID('12345678-1234-5678-1234-567812345678')).toBe('12345678-1234-5678-1234-567812345678');
    });

    it('should normalize 16-bit UUID to canonical 128-bit form', () => {
      expect(validateServiceUUID('abcd')).toBe('0000abcd-0000-1000-8000-00805f9b34fb');
    });

    it('should normalize uppercase UUID to lowercase', () => {
      expect(validateServiceUUID('ABCD')).toBe('0000abcd-0000-1000-8000-00805f9b34fb');
      expect(validateServiceUUID('12345678-1234-5678-1234-567812345678'.toUpperCase())).toBe('12345678-1234-5678-1234-567812345678');
    });

    it('should throw on invalid UUID (too short)', () => {
      expect(() => validateServiceUUID('12')).toThrow();
    });

    it('should throw on invalid UUID (bad format)', () => {
      expect(() => validateServiceUUID('not-a-uuid')).toThrow();
    });

    it('should throw on empty string', () => {
      expect(() => validateServiceUUID('')).toThrow();
    });

    it('should throw on null/undefined', () => {
      // @ts-expect-error
      expect(() => validateServiceUUID(null)).toThrow();
      // @ts-expect-error
      expect(() => validateServiceUUID(undefined)).toThrow();
    });
  });

  describe('Device Advertisement Parsing', () => {
    it('should extract mesh message from BLE advertisement', () => {
      const message = {
        id: 'id-1',
        srcId: '65890001',
        dstId: '65890002',
        content: 'hi',
        timestamp: 111111,
        hops: ['65890001'],
        ttl: 10,
        msgId: 0x1002,
      };
      const manufacturerData = encodeManufacturerData(message);
      const adv = { manufacturerData };
      const parsed = parseDeviceAdvertisement(adv);
      expect(parsed).toMatchObject({
        id: message.id,
        srcId: message.srcId,
        dstId: message.dstId,
        content: message.content,
        timestamp: message.timestamp,
        ttl: message.ttl,
        msgId: message.msgId,
      });
      expect(Array.isArray(parsed.hops)).toBe(true);
      expect(parsed.hops[0]).toBe(message.hops[0]);
    });

    it('should return null if advertisement does not contain mesh data', () => {
      expect(parseDeviceAdvertisement({})).toBeNull();
      expect(parseDeviceAdvertisement({ manufacturerData: Buffer.alloc(0) })).toBeNull();
      expect(parseDeviceAdvertisement({ manufacturerData: Buffer.from([0x01, 0x02]) })).toBeNull();
    });
  });

  describe('Message Serialization/Deserialization', () => {
    it('should serialize a message object to buffer', () => {
      const message = {
        id: 'ser-1',
        srcId: '65890010',
        dstId: '65890011',
        content: 'serialize',
        timestamp: 222222,
        hops: ['65890010'],
        ttl: 5,
        msgId: 0x2002,
      };
      const buf = serializeMessage(message);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.length).toBeGreaterThan(0);
    });

    it('should deserialize buffer to message object', () => {
      const original = {
        id: 'ser-2',
        srcId: '65890012',
        dstId: '65890013',
        content: 'deserialize',
        timestamp: 333333,
        hops: ['65890012', '65890013'],
        ttl: 7,
        msgId: 0x2003,
      };
      const buf = serializeMessage(original);
      const decoded = deserializeMessage(buf);
      expect(decoded).toMatchObject({
        id: original.id,
        srcId: original.srcId,
        dstId: original.dstId,
        content: original.content,
        timestamp: original.timestamp,
        ttl: original.ttl,
        msgId: original.msgId,
      });
      expect(Array.isArray(decoded.hops)).toBe(true);
      expect(decoded.hops.length).toBeGreaterThan(0);
    });

    it('should throw on invalid buffer', () => {
      const badBuf = Buffer.from([0x01, 0x02, 0x03]);
      expect(() => deserializeMessage(badBuf)).toThrow();
    });
  });

  describe('Phone Number and Message ID Matching', () => {
    it('should match phone numbers byte-wise', () => {
      expect(matchPhoneNumber('65890001', '65890001')).toBe(true);
      expect(matchPhoneNumber('65890001', '65890001')).toBe(true);
    });

    it('should not match different phone numbers', () => {
      expect(matchPhoneNumber('65890001', '65890002')).toBe(false);
      expect(matchPhoneNumber('12345678', '87654321')).toBe(false);
    });

    it('should match message IDs for deduplication', () => {
      expect(matchMessageId('id-1', 'id-1')).toBe(true);
      expect(matchMessageId('abc123', 'abc123')).toBe(true);
    });

    it('should not match different message IDs', () => {
      expect(matchMessageId('id-1', 'id-2')).toBe(false);
      expect(matchMessageId('abc', 'def')).toBe(false);
    });
  });
});
