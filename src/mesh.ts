/**
 * BLE Mesh Network Manager
 * Handles BLE advertising, scanning, and message relay
 */

import noble from '@abandonware/noble';
import { EventEmitter } from 'events';
import { 
  Message, 
  serializeMessage, 
  deserializeMessage, 
  phoneNumberMatches,
  MAX_HOPS
} from './protocol';

// Service UUID for ghost-mesh
const GHOST_MESH_SERVICE_UUID = '12345678123456781234567812345678';
const MESSAGE_CHARACTERISTIC_UUID = '87654321876543218765432187654321';

export class MeshNode extends EventEmitter {
  private phoneNumber: string;
  private seenMessages: Set<string> = new Set();
  private messageQueue: Message[] = [];
  private isScanning: boolean = false;

  constructor(phoneNumber: string) {
    super();
    this.phoneNumber = phoneNumber;
  }

  /**
   * Start the mesh node
   */
  async start(): Promise<void> {
    await this.waitForBluetooth();
    await this.startScanning();
    this.emit('started', { phoneNumber: this.phoneNumber });
  }

  /**
   * Stop the mesh node
   */
  async stop(): Promise<void> {
    if (this.isScanning) {
      await noble.stopScanning();
      this.isScanning = false;
    }
    this.emit('stopped');
  }

  /**
   * Send a message to a destination phone number
   */
  sendMessage(to: string, content: string): Message {
    const message: Message = {
      to,
      from: this.phoneNumber,
      content,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      hops: 0
    };

    this.messageQueue.push(message);
    this.seenMessages.add(message.id);
    this.broadcastMessage(message);
    this.emit('messageSent', message);
    
    return message;
  }

  /**
   * Wait for Bluetooth to be ready
   */
  private waitForBluetooth(): Promise<void> {
    return new Promise((resolve) => {
      if ((noble as any).state === 'poweredOn') {
        resolve();
      } else {
        noble.once('stateChange', (state) => {
          if (state === 'poweredOn') {
            resolve();
          }
        });
      }
    });
  }

  /**
   * Start scanning for BLE advertisements
   */
  private async startScanning(): Promise<void> {
    if (this.isScanning) {
      return;
    }

    noble.on('discover', (peripheral) => {
      this.handlePeripheralDiscovered(peripheral);
    });

    await noble.startScanning([], true);
    this.isScanning = true;
    this.emit('scanning', true);
  }

  /**
   * Handle discovered BLE peripheral
   */
  private handlePeripheralDiscovered(peripheral: any): void {
    const advertisement = peripheral.advertisement;
    
    // Look for ghost-mesh service data
    if (advertisement.serviceData) {
      for (const serviceData of advertisement.serviceData) {
        if (serviceData.uuid === GHOST_MESH_SERVICE_UUID) {
          this.handleMessageReceived(serviceData.data);
        }
      }
    }
  }

  /**
   * Handle received message
   */
  private handleMessageReceived(buffer: Buffer): void {
    const message = deserializeMessage(buffer);
    
    if (!message) {
      return; // Invalid message
    }

    // Check if we've already seen this message (prevent loops)
    if (this.seenMessages.has(message.id)) {
      return;
    }

    // Mark as seen
    this.seenMessages.add(message.id);

    // Check if message is for us
    if (phoneNumberMatches(this.phoneNumber, message.to)) {
      this.emit('messageReceived', message);
    }

    // Auto-relay if hops remaining
    if (message.hops < MAX_HOPS) {
      const relayMessage = { ...message, hops: message.hops + 1 };
      setTimeout(() => {
        this.broadcastMessage(relayMessage);
        this.emit('messageRelayed', relayMessage);
      }, 100 + Math.random() * 400); // Random delay to reduce collisions
    }
  }

  /**
   * Broadcast a message via BLE
   */
  private broadcastMessage(message: Message): void {
    // In a real implementation, this would use BLE advertising or GATT
    // For now, we'll emit an event that could be handled by a platform-specific layer
    this.emit('broadcast', {
      message,
      buffer: serializeMessage(message)
    });
  }

  /**
   * Get the node's phone number
   */
  getPhoneNumber(): string {
    return this.phoneNumber;
  }

  /**
   * Get seen messages count
   */
  getSeenMessagesCount(): number {
    return this.seenMessages.size;
  }

  /**
   * Clear old seen messages to prevent memory growth
   */
  clearOldSeenMessages(olderThan: number = 3600000): void {
    const cutoff = Date.now() - olderThan;
    const messagesToRemove: string[] = [];
    
    // Note: This is a simple implementation. In production, you'd want to
    // store timestamps with message IDs for proper cleanup
    if (this.seenMessages.size > 1000) {
      const messages = Array.from(this.seenMessages);
      // Remove oldest half
      for (let i = 0; i < messages.length / 2; i++) {
        messagesToRemove.push(messages[i]);
      }
      messagesToRemove.forEach(id => this.seenMessages.delete(id));
    }
  }
}
