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
  MAX_HOPS,
  generateMessageId
} from './protocol';
import { logger } from './logger';

// Service UUID for ghost-mesh
const GHOST_MESH_SERVICE_UUID = '12345678123456781234567812345678';
const MESSAGE_CHARACTERISTIC_UUID = '87654321876543218765432187654321';

// Device timeout configuration
const DEVICE_TIMEOUT_MS = 30000; // 30 seconds - device considered offline
const DEVICE_CLEANUP_INTERVAL_MS = 5000; // Check every 5 seconds
const DEVICE_ACTIVE_THRESHOLD_MS = 10000; // 10 seconds - recent activity

interface DeviceInfo {
  lastSeen: number;
  rssi: number;
  firstSeen: number;
  activityCount: number;
  isActive: boolean;
}

export class MeshNode extends EventEmitter {
  private phoneNumber: string;
  private seenMessages: Set<string> = new Set();
  private messageQueue: Message[] = [];
  private isScanning: boolean = false;
  private discoveredDevices: Map<string, DeviceInfo> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

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
    this.startDeviceCleanup();
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
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
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
      id: generateMessageId(),
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
    return new Promise((resolve, reject) => {
      const currentState = (noble as any).state;

      if (currentState === 'poweredOn') {
        resolve();
        return;
      }

      // Check for definite error states (but not "unknown")
      if (currentState === 'unsupported') {
        reject(new Error('Bluetooth is not supported on this system'));
        return;
      }

      if (currentState === 'unauthorized') {
        reject(new Error('Bluetooth access is unauthorized. Please enable Bluetooth permissions.'));
        return;
      }

      if (currentState === 'poweredOff') {
        reject(new Error('Bluetooth is powered off. Please turn on Bluetooth in Windows Settings.'));
        return;
      }

      // If state is "unknown" or any other state, wait for state change
      // Windows often starts with "unknown" and transitions to "poweredOn"
      const timeout = setTimeout(() => {
        reject(new Error(`Bluetooth initialization timeout. State remained: ${(noble as any).state}. Please check that:\n1. Visual Studio Build Tools with C++ are installed\n2. Windows Bluetooth is enabled\n3. Bluetooth adapter is present in Device Manager\n4. Try: npm rebuild @abandonware/noble`));
      }, 15000); // 15 second timeout

      noble.once('stateChange', (state) => {
        clearTimeout(timeout);
        if (state === 'poweredOn') {
          resolve();
        } else if (state === 'poweredOff') {
          reject(new Error('Bluetooth is powered off. Please turn on Bluetooth in Windows Settings.'));
        } else if (state === 'unsupported') {
          reject(new Error('Bluetooth is not supported on this system'));
        } else if (state === 'unauthorized') {
          reject(new Error('Bluetooth access is unauthorized. Please enable Bluetooth permissions.'));
        } else {
          reject(new Error(`Bluetooth state changed to: ${state}`));
        }
      });
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
    logger.success('📡 BLE scanning started - listening for devices...');
    this.emit('scanning', true);

    // Log scanning status periodically
    const scanningStatusInterval = setInterval(() => {
      if (!this.isScanning) {
        clearInterval(scanningStatusInterval);
        return;
      }
      const activeDevices = this.getActiveDeviceCount();
      const totalDevices = this.discoveredDevices.size;
      logger.info(`📡 Scanning... Active devices: ${activeDevices}, Total tracked: ${totalDevices}`);
    }, 30000); // Log every 30 seconds
  }

  /**
   * Handle discovered BLE peripheral
   */
  private handlePeripheralDiscovered(peripheral: any): void {
    const advertisement = peripheral.advertisement;
    const now = Date.now();
    const deviceId = peripheral.id;

    // Update or create device tracking info
    const existingDevice = this.discoveredDevices.get(deviceId);
    const isNewDevice = !existingDevice;

    const deviceInfo: DeviceInfo = {
      lastSeen: now,
      rssi: peripheral.rssi,
      firstSeen: existingDevice?.firstSeen || now,
      activityCount: (existingDevice?.activityCount || 0) + 1,
      isActive: true,
    };

    this.discoveredDevices.set(deviceId, deviceInfo);

    // Always emit device discovered event to maintain count updates
    // This ensures the UI gets updates even for repeat advertisements
    this.emit('deviceDiscovered', {
      id: deviceId,
      rssi: peripheral.rssi,
      totalCount: this.getActiveDeviceCount(),
      isNew: isNewDevice,
    });

    // Log ALL discovered BLE devices for debugging
    logger.ble('BLE Device discovered:', {
      id: peripheral.id,
      address: peripheral.address,
      addressType: peripheral.addressType,
      rssi: peripheral.rssi,
      localName: advertisement.localName,
      txPowerLevel: advertisement.txPowerLevel,
      manufacturerData: advertisement.manufacturerData?.toString('hex'),
      serviceUuids: advertisement.serviceUuids,
      serviceDataCount: advertisement.serviceData?.length || 0,
    });

    // Log service data in detail
    if (advertisement.serviceData && advertisement.serviceData.length > 0) {
      logger.debug('  Service Data:', advertisement.serviceData.map((sd: any) => ({
        uuid: sd.uuid,
        dataHex: sd.data.toString('hex'),
        dataLength: sd.data.length,
      })));
    }

    // Look for ghost-mesh service data
    if (advertisement.serviceData) {
      for (const serviceData of advertisement.serviceData) {
        if (serviceData.uuid === GHOST_MESH_SERVICE_UUID) {
          logger.success('Found GhostMesh service data!');
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

  /**
   * Start periodic device cleanup to remove stale devices
   */
  private startDeviceCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleDevices();
    }, DEVICE_CLEANUP_INTERVAL_MS);
  }

  /**
   * Remove devices that haven't been seen recently
   */
  private cleanupStaleDevices(): void {
    const now = Date.now();
    const devicesToRemove: string[] = [];
    const devicesNowInactive: string[] = [];

    for (const [deviceId, device] of this.discoveredDevices.entries()) {
      const timeSinceLastSeen = now - device.lastSeen;

      // Mark device as inactive if not recently seen
      if (timeSinceLastSeen > DEVICE_ACTIVE_THRESHOLD_MS && device.isActive) {
        device.isActive = false;
        devicesNowInactive.push(deviceId);
      }

      // Remove device if timeout exceeded
      if (timeSinceLastSeen > DEVICE_TIMEOUT_MS) {
        devicesToRemove.push(deviceId);
      }
    }

    // Emit inactive status updates
    devicesNowInactive.forEach(deviceId => {
      this.emit('deviceInactive', {
        id: deviceId,
        lastSeen: this.discoveredDevices.get(deviceId)?.lastSeen,
      });
    });

    // Remove timed out devices
    if (devicesToRemove.length > 0) {
      devicesToRemove.forEach(deviceId => {
        const device = this.discoveredDevices.get(deviceId);
        this.discoveredDevices.delete(deviceId);
        logger.ble(`Device ${deviceId} removed (timeout - last seen ${Math.floor((now - (device?.lastSeen || 0)) / 1000)}s ago)`);
      });

      // Emit device list update
      this.emit('devicesUpdated', {
        activeCount: this.getActiveDeviceCount(),
        totalCount: this.discoveredDevices.size,
        removed: devicesToRemove,
      });
    }
  }

  /**
   * Get count of active devices (recently seen)
   */
  private getActiveDeviceCount(): number {
    const now = Date.now();
    let activeCount = 0;

    for (const device of this.discoveredDevices.values()) {
      if (device.isActive || (now - device.lastSeen) < DEVICE_ACTIVE_THRESHOLD_MS) {
        activeCount++;
      }
    }

    return activeCount;
  }

  /**
   * Get list of all tracked devices
   */
  getDevices(): Array<{ id: string; lastSeen: number; rssi: number; isActive: boolean; activityCount: number }> {
    const devices: Array<{ id: string; lastSeen: number; rssi: number; isActive: boolean; activityCount: number }> = [];

    for (const [id, device] of this.discoveredDevices.entries()) {
      devices.push({
        id,
        lastSeen: device.lastSeen,
        rssi: device.rssi,
        isActive: device.isActive,
        activityCount: device.activityCount,
      });
    }

    // Sort by last seen (most recent first)
    devices.sort((a, b) => b.lastSeen - a.lastSeen);

    return devices;
  }
}
