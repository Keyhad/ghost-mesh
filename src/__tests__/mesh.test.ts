/**
 * Tests for MeshNode
 */

import { MeshNode } from '../mesh';
import { Message } from '../protocol';

// Mock the noble module
jest.mock('@abandonware/noble', () => {
  const EventEmitter = require('events');
  const mockNoble = new EventEmitter();
  mockNoble.state = 'poweredOn';
  mockNoble.startScanning = jest.fn().mockResolvedValue(undefined);
  mockNoble.stopScanning = jest.fn().mockResolvedValue(undefined);
  mockNoble.on = jest.fn();
  return mockNoble;
});

describe('MeshNode', () => {
  let node: MeshNode;

  beforeEach(() => {
    node = new MeshNode('+1234567890');
  });

  afterEach(async () => {
    if (node) {
      await node.stop();
    }
  });

  describe('Construction', () => {
    it('should create a node with a phone number', () => {
      expect(node.getPhoneNumber()).toBe('+1234567890');
    });

    it('should initialize with zero seen messages', () => {
      expect(node.getSeenMessagesCount()).toBe(0);
    });
  });

  describe('Message Sending', () => {
    it('should send a message and emit messageSent event', (done) => {
      node.on('messageSent', (message: Message) => {
        expect(message.to).toBe('+0987654321');
        expect(message.from).toBe('+1234567890');
        expect(message.content).toBe('Test message');
        expect(message.hops).toBe(0);
        done();
      });

      node.sendMessage('+0987654321', 'Test message');
    });

    it('should increment seen messages when sending', () => {
      const initialCount = node.getSeenMessagesCount();
      node.sendMessage('+0987654321', 'Test');
      expect(node.getSeenMessagesCount()).toBe(initialCount + 1);
    });

    it('should emit broadcast event when sending', (done) => {
      node.on('broadcast', ({ message, buffer }) => {
        expect(message.to).toBe('+0987654321');
        expect(buffer).toBeInstanceOf(Buffer);
        done();
      });

      node.sendMessage('+0987654321', 'Test message');
    });
  });

  describe('Seen Messages Management', () => {
    it('should clear old seen messages when limit reached', () => {
      // Add many messages to trigger cleanup
      for (let i = 0; i < 1100; i++) {
        node.sendMessage(`+${i}`, `Message ${i}`);
      }

      const beforeCleanup = node.getSeenMessagesCount();
      node.clearOldSeenMessages();
      const afterCleanup = node.getSeenMessagesCount();

      expect(afterCleanup).toBeLessThan(beforeCleanup);
    });
  });
});
