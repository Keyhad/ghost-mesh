/**
 * BLE Mesh Network Manager
 * Handles BLE advertising, scanning, and message relay
 */

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

// Platform-specific BLE library imports
let noble: any;
let bleno: any;

if (process.platform === 'win32') {
  // Windows: Use @stoprocent/noble (better Windows support)
  try {
    noble = require('@stoprocent/noble');
    // Note: BLE advertising (bleno) not supported on Windows
    bleno = null;
    logger.info('🪟 Using Windows Bluetooth bindings (@stoprocent/noble)');
    logger.info('📡 Scanning enabled, advertising not available on Windows');
  } catch (error) {
    logger.error('Failed to load Windows BLE library:', error);
    throw error;
  }
} else {
  // macOS/Linux: Use abandonware libraries
  noble = require('@abandonware/noble');
  bleno = require('@abandonware/bleno');
  logger.info('🍎 Using macOS/Linux Bluetooth bindings');
}

// Service UUID for ghost-mesh (shortened for advertising)
const GHOST_MESH_SERVICE_UUID = '1234';
const MESSAGE_CHARACTERISTIC_UUID = '87654321876543218765432187654321';

// BLE Advertising configuration
const ADVERTISING_INTERVAL_MS = 100; // Advertise every 100ms
const MESSAGE_ROTATION_MS = 2000; // Rotate through queued messages every 2 seconds

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
  private isAdvertising: boolean = false;
  private discoveredDevices: Map<string, DeviceInfo> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private advertisingInterval: NodeJS.Timeout | null = null;
  private currentAdvertisingIndex: number = 0;

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
    await this.startAdvertising();
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
    if (this.isAdvertising) {
      await this.stopAdvertising();
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    if (this.advertisingInterval) {
      clearInterval(this.advertisingInterval);
      this.advertisingInterval = null;
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

    // Check if this is a GhostMesh device
    const isGhostMesh = advertisement.localName === 'GhostMesh' ||
                        (advertisement.serviceUuids && advertisement.serviceUuids.includes(GHOST_MESH_SERVICE_UUID));

    // Debug: Log all discovered devices with details
    if (advertisement.localName || advertisement.serviceUuids?.length > 0) {
      logger.debug(`BLE: ${advertisement.localName || 'Unknown'} | UUIDs: ${advertisement.serviceUuids?.join(', ') || 'none'} | ${peripheral.rssi}dBm ${isGhostMesh ? '✅ GHOSTMESH' : ''}`);
    }

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
    if (isGhostMesh) {
      logger.ble('GhostMesh Device discovered:', {
        id: peripheral.id,
        address: peripheral.address,
        rssi: peripheral.rssi,
        localName: advertisement.localName,
      });
    }

    // Try to extract message from advertising data
    // Priority 1: Service Data (if available)
    if (isGhostMesh && advertisement.serviceData) {
      for (const serviceData of advertisement.serviceData) {
        if (serviceData.uuid === GHOST_MESH_SERVICE_UUID) {
          logger.success('Found GhostMesh service data!');
          this.handleMessageReceived(serviceData.data, peripheral.rssi, deviceId);
          return;
        }
      }
    }

    // Priority 2: Manufacturer Data
    if (isGhostMesh && advertisement.manufacturerData && advertisement.manufacturerData.length > 0) {
      logger.debug('GhostMesh manufacturer data:', advertisement.manufacturerData.toString('hex'));
      this.handleMessageReceived(advertisement.manufacturerData, peripheral.rssi, deviceId);
    }
  }

  /**
   * Handle received message from advertising data
   */
  private handleMessageReceived(data: Buffer, rssi: number, deviceId: string): void {
    try {
      // Skip if data is too small
      if (data.length < 10) {
        logger.debug('Advertising data too small, skipping');
        return;
      }

      // Try to deserialize message
      const message = deserializeMessage(data);

      if (!message) {
        logger.debug('Could not deserialize message from advertising data');
        return;
      }

      logger.message(`📨 Message received via BLE advertising from ${deviceId}: ${message.id}`);
      logger.debug('Message details:', {
        from: message.from,
        to: message.to,
        hops: message.hops,
        contentLength: message.content.length,
        rssi
      });

      // Process the received message
      this.processReceivedMessage(message);

    } catch (error) {
      logger.debug('Error parsing advertising data:', error);
    }
  }

  /**
   * Process received message (check if for us, relay if needed)
   */
  private processReceivedMessage(message: Message): void {
    // Check if we've already seen this message (prevent loops)
    if (this.seenMessages.has(message.id)) {
      logger.debug(`Duplicate message ${message.id}, skipping`);

      // Remove from advertising queue since another node is relaying it
      this.removeFromAdvertisingQueue(message.id);

      return;
    }

    // Mark as seen
    this.seenMessages.add(message.id);

    // Check if message is for us or broadcast
    const isForUs = phoneNumberMatches(this.phoneNumber, message.to) || message.to === 'BROADCAST';

    if (isForUs) {
      logger.success(`✅ Message is for us: ${message.id}`);
      this.emit('messageReceived', message);
    } else {
      logger.debug(`Message ${message.id} is for ${message.to}, not us`);
    }

    // Auto-relay if hops remaining
    if (message.hops < MAX_HOPS) {
      const relayMessage = { ...message, hops: message.hops + 1 };
      setTimeout(() => {
        this.broadcastMessage(relayMessage);
        this.emit('messageRelayed', relayMessage);
        logger.info(`🔄 Relaying message ${message.id} (hop ${relayMessage.hops})`);
      }, 100 + Math.random() * 400); // Random delay to reduce collisions
    }
  }

  /**
   * Broadcast a message via BLE
   */
  private broadcastMessage(message: Message): void {
    // Add to queue for advertising rotation
    this.messageQueue.push(message);

    // Keep queue size manageable (last 10 messages)
    if (this.messageQueue.length > 10) {
      this.messageQueue.shift();
    }

    // Immediately update advertising data with new message
    this.updateAdvertisingData();

    this.emit('broadcast', {
      message,
      buffer: serializeMessage(message)
    });
  }

  /**
   * Remove message from advertising queue (when confirmed relayed by another node)
   */
  private removeFromAdvertisingQueue(messageId: string): void {
    const beforeLength = this.messageQueue.length;
    this.messageQueue = this.messageQueue.filter(msg => msg.id !== messageId);

    if (this.messageQueue.length < beforeLength) {
      logger.info(`🛑 Stopped advertising message ${messageId.substring(0, 8)}... (confirmed relayed by another node)`);
      this.updateAdvertisingData();
    }
  }

  /**
   * Start BLE advertising with message payloads
   */
  private async startAdvertising(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if bleno is available (not on Windows)
      if (!bleno) {
        logger.warn('⚠️  BLE advertising not supported on Windows platform');
        logger.info('💡 You can still receive messages via scanning');
        resolve(); // Don't fail, just skip advertising
        return;
      }

      const startAdvertisingNow = () => {
        // Start advertising with message rotation
        this.updateAdvertisingData();

        // Rotate through messages in queue
        this.advertisingInterval = setInterval(() => {
          this.updateAdvertisingData();
        }, MESSAGE_ROTATION_MS);

        this.isAdvertising = true;
        logger.success('📡 BLE advertising started - broadcasting messages...');
        resolve();
      };

      const currentState = bleno.state;

      if (currentState === 'poweredOn') {
        startAdvertisingNow();
      } else {
        bleno.once('stateChange', (state) => {
          if (state === 'poweredOn') {
            startAdvertisingNow();
          } else {
            reject(new Error(`Bleno state changed to: ${state}`));
          }
        });
      }
    });
  }

  /**
   * Stop BLE advertising
   */
  private async stopAdvertising(): Promise<void> {
    if (this.isAdvertising) {
      return new Promise((resolve) => {
        bleno.stopAdvertising(() => {
          this.isAdvertising = false;
          logger.info('BLE advertising stopped');
          resolve();
        });
      });
    }
  }

  /**
   * Update advertising data with current message
   */
  private updateAdvertisingData(): void {
    // Skip if bleno not available (Windows)
    if (!bleno) {
      return;
    }

    if (!this.isAdvertising && !bleno.state) {
      return;
    }

    let advertisingData: Buffer;

    if (this.messageQueue.length > 0) {
      // Rotate through messages
      this.currentAdvertisingIndex = (this.currentAdvertisingIndex + 1) % this.messageQueue.length;
      const message = this.messageQueue[this.currentAdvertisingIndex];

      // Serialize message to binary
      const messageBuffer = serializeMessage(message);

      // BLE advertising data is limited to 31 bytes total
      // We'll use manufacturer data format to maximize payload
      advertisingData = messageBuffer.slice(0, 27); // Keep within limits

      logger.debug(`Broadcasting message ${message.id.substring(0, 8)}... (${advertisingData.length} bytes)`);
    } else {
      // Idle beacon - just announce presence
      const idleData = Buffer.from(`GM:${this.phoneNumber.substring(-4)}`);
      advertisingData = idleData.slice(0, 27);
    }

    // Start/restart advertising with new data
    bleno.startAdvertising(
      'GhostMesh', // Local name
      [GHOST_MESH_SERVICE_UUID], // Service UUIDs
      (error) => {
        if (error) {
          logger.error('Advertising error:', error);
        }
      }
    );

    // Set manufacturer data (0xFFFF = custom manufacturer ID)
    bleno.updateRssi();
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
