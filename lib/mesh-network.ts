'use client';

import { Message, Device } from './types';
import { storage } from './storage';
import { WebBluetoothMesh } from './web-bluetooth';

const WS_URL = process.env.NEXT_PUBLIC_BLE_WS_URL || 'ws://localhost:8080';
const USE_WEB_BLUETOOTH = typeof window !== 'undefined' && WebBluetoothMesh.isSupported();

interface ServerEvent {
  type: 'connected' | 'device_update' | 'device_removed' | 'devices_list' | 'message_received' | 'message_sent' | 'error';
  device?: any;
  devices?: any[];
  message?: any;
  error?: string;
  activeCount?: number;
  totalCount?: number;
}

export class GhostMeshNetwork {
  private myPhone: string;
  private ws: WebSocket | null = null;
  private webBluetooth: WebBluetoothMesh | null = null;
  private usingWebBluetooth: boolean = false;
  private devices: Device[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private onDeviceUpdate?: (devices: Device[]) => void;
  private onMessageReceived?: (message: Message) => void;
  private meshActive: boolean = false;
  private onStatusChange?: (active: boolean) => void;
  private performanceData: Array<{ timestamp: number; bleDeviceCount: number }> = [];
  private onPerformanceUpdate?: (data: Array<{ timestamp: number; bleDeviceCount: number }>) => void;
  private performanceInterval: NodeJS.Timeout | null = null;
  private bleDeviceCount: number = 0;

  constructor(myPhone: string) {
    this.myPhone = myPhone;
    this.loadDevices();
    this.connectWebSocket();
    this.startPerformanceMonitoring();
  }

  private loadDevices = () => {
    this.devices = storage.getDevices();
  };

  private connectWebSocket = () => {
    try {
      console.log(`🔌 Connecting to BLE server at ${WS_URL}...`);
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('✅ Connected to BLE server');
        this.reconnectAttempts = 0;

        // Initialize mesh node with our phone number
        this.sendCommand({
          type: 'init',
          phoneNumber: this.myPhone,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const serverEvent: ServerEvent = JSON.parse(event.data);
          this.handleServerEvent(serverEvent);
        } catch (error) {
          console.error('Error parsing server event:', error);
        }
      };

      this.ws.onerror = (event) => {
        console.error('❌ WebSocket connection error - Failed to connect to BLE server');
        console.warn('💡 Make sure the BLE server is running: npm run dev:server');
        console.info(`🔗 Expected server URL: ${WS_URL}`);
      };

      this.ws.onclose = () => {
        console.log('🔌 Disconnected from BLE server');
        this.ws = null;
        this.meshActive = false;
        this.onStatusChange?.(false);
        this.attemptReconnect();
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to create WebSocket connection:', errorMessage);
      console.warn('💡 Ensure BLE server is running on ws://localhost:8080');
      this.attemptReconnect();
    }
  };

  private attemptReconnect = () => {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached.');

      // Suggest Web Bluetooth but don't auto-trigger (requires user gesture)
      if (USE_WEB_BLUETOOTH && !this.usingWebBluetooth) {
        console.warn('💡 BLE server not available. You can use Web Bluetooth instead.');
        console.info('🌐 Call network.enableWebBluetooth() or add a button to enable it.');
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.reconnectTimeout = setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  };

  /**
   * Enable Web Bluetooth (must be called from user gesture like button click)
   */
  enableWebBluetooth = async (): Promise<void> => {
    if (this.usingWebBluetooth) {
      console.warn('Web Bluetooth already active');
      return;
    }

    if (!USE_WEB_BLUETOOTH) {
      throw new Error('Web Bluetooth not supported in this browser');
    }

    try {
      console.log('🌐 Initializing Web Bluetooth...');
      this.webBluetooth = new WebBluetoothMesh(this.myPhone);

      this.webBluetooth.onDevice((deviceId, rssi) => {
        console.log(`📡 Web BLE Device found: ${deviceId} (${rssi} dBm)`);
        this.bleDeviceCount++;
      });

      this.webBluetooth.onMessage((message) => {
        console.log('📬 Message received via Web Bluetooth:', message);
        this.onMessageReceived?.(message);
        storage.addMessage(message);
      });

      await this.webBluetooth.startScanning();
      this.usingWebBluetooth = true;
      this.meshActive = true;
      this.onStatusChange?.(true);

      console.log('✅ Web Bluetooth mesh active');
      console.info('💡 To enable advertising: chrome://flags/#enable-experimental-web-platform-features');
    } catch (error) {
      console.error('Failed to initialize Web Bluetooth:', error);
      this.usingWebBluetooth = false;
      throw error;
    }
  };

  /**
   * Check if Web Bluetooth is available
   */
  isWebBluetoothAvailable = (): boolean => {
    return USE_WEB_BLUETOOTH && !this.usingWebBluetooth;
  };

  private handleServerEvent = (event: ServerEvent) => {
    switch (event.type) {
      case 'connected':
        console.log('✅ BLE mesh node initialized');
        this.meshActive = true;
        this.onStatusChange?.(true);
        break;

      case 'device_update':
        // Handle single device update
        if (event.device) {
          this.updateSingleDevice(event.device);
        }
        // Update active device count if provided
        if (event.activeCount !== undefined) {
          this.bleDeviceCount = event.activeCount;
        }
        break;

      case 'device_removed':
        // Handle device removal
        if (event.devices) {
          event.devices.forEach(removedDevice => {
            this.devices = this.devices.filter(d => d.id !== removedDevice.id);
          });
          storage.updateDevices(this.devices);
          this.onDeviceUpdate?.(this.devices);
        }
        // Update counts
        if (event.activeCount !== undefined) {
          this.bleDeviceCount = event.activeCount;
        }
        break;

      case 'devices_list':
        // Handle full device list
        if (event.devices) {
          this.updateDevicesList(event.devices);
        }
        if (event.activeCount !== undefined) {
          this.bleDeviceCount = event.activeCount;
        }
        break;

      case 'message_received':
        if (event.message) {
          this.handleReceivedMessage(event.message);
        }
        break;

      case 'message_sent':
        if (event.message) {
          // Message was successfully sent via BLE
          console.log('📤 Message sent via BLE:', event.message.id);
        }
        break;

      case 'error':
        console.error('❌ BLE server error:', event.error);
        this.meshActive = false;
        this.onStatusChange?.(false);
        break;

      default:
        console.warn('Unknown server event:', event.type);
    }
  };

  private updateSingleDevice = (deviceData: any) => {
    const existing = this.devices.find(d => d.id === deviceData.id);

    if (existing) {
      existing.connected = deviceData.isActive || false;
      existing.lastSeen = deviceData.lastSeen || Date.now();
      existing.rssi = deviceData.rssi;
      existing.activityCount = deviceData.activityCount;
    } else if (deviceData.status !== 'removed') {
      this.devices.push({
        id: deviceData.id,
        peerId: deviceData.id,
        lastSeen: deviceData.lastSeen || Date.now(),
        connected: deviceData.isActive || false,
        rssi: deviceData.rssi,
        activityCount: deviceData.activityCount,
      });
    }

    storage.updateDevices(this.devices);
    this.onDeviceUpdate?.(this.devices);
  };

  private updateDevicesList = (newDevices: any[]) => {
    // Replace device list with new data
    this.devices = newDevices.map(d => ({
      id: d.id,
      peerId: d.id,
      lastSeen: d.lastSeen || Date.now(),
      connected: d.isActive || false,
      rssi: d.rssi,
      activityCount: d.activityCount,
    }));

    storage.updateDevices(this.devices);
    this.onDeviceUpdate?.(this.devices);
  };

  private updateDevices = (newDevices: any[]) => {
    newDevices.forEach(newDevice => {
      const existing = this.devices.find(d => d.id === newDevice.id);
      if (existing) {
        existing.connected = newDevice.connected;
        existing.lastSeen = newDevice.lastSeen || Date.now();
      } else {
        this.devices.push({
          id: newDevice.id,
          peerId: newDevice.id,
          lastSeen: newDevice.lastSeen || Date.now(),
          connected: newDevice.connected,
        });
      }
    });

    storage.updateDevices(this.devices);
    this.onDeviceUpdate?.(this.devices);
  };

  private sendCommand = (command: any) => {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command));
    } else {
      console.warn('⚠️ WebSocket not connected, command queued');
    }
  };

  setOnDeviceUpdate(callback: (devices: Device[]) => void) {
    this.onDeviceUpdate = callback;
  }

  setOnMessageReceived(callback: (message: Message) => void) {
    this.onMessageReceived = callback;
  }

  sendMessage(dstId: string, content: string, msgId?: number) {
    const message: Message = {
      id: `${Date.now()}-${Math.random()}`,
      srcId: this.myPhone,
      dstId,
      content,
      timestamp: Date.now(),
      hops: [this.myPhone],
      ttl: 10,
      msgId, // Protocol MSG ID (0xFFF0 for SOS)
    };

    storage.addMessage(message);

    // Send via Web Bluetooth if active
    if (this.usingWebBluetooth && this.webBluetooth) {
      this.webBluetooth.startAdvertising(message).catch(err => {
        console.warn('⚠️ Web Bluetooth advertising failed:', err);
      });
      return;
    }

    // Otherwise send via WebSocket to BLE server
    this.sendCommand({
      type: 'send_message',
      to: dstId,
      content,
      msgId, // Include msgId in transmission
    });
  }

  private handleReceivedMessage = (message: Message) => {
    // Store the message
    storage.addMessage(message);

    // If we're the destination, notify
    if (message.dstId === this.myPhone) {
      this.onMessageReceived?.(message);
    }
  };

  getConnectedDevices(): Device[] {
    return this.devices.filter(d => d.connected);
  }

  getAllDevices(): Device[] {
    return this.devices;
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
      this.performanceInterval = null;
    }

    if (this.ws) {
      this.sendCommand({ type: 'disconnect' });
      this.ws.close();
      this.ws = null;
    }
  }

  setOnStatusChange(callback: (active: boolean) => void) {
    this.onStatusChange = callback;
  }

  isMeshActive(): boolean {
    return this.meshActive;
  }

  private startPerformanceMonitoring = () => {
    // Sample BLE device count every 10 seconds
    this.performanceInterval = setInterval(() => {
      const dataPoint = {
        timestamp: Date.now(),
        bleDeviceCount: this.bleDeviceCount,
      };

      this.performanceData.push(dataPoint);

      // Keep only last 18 samples (3 minutes of data)
      if (this.performanceData.length > 18) {
        this.performanceData.shift();
      }

      this.onPerformanceUpdate?.(this.performanceData);
    }, 10000); // 10 seconds
  };

  setOnPerformanceUpdate(callback: (data: Array<{ timestamp: number; bleDeviceCount: number }>) => void) {
    this.onPerformanceUpdate = callback;
    // Send initial data
    if (this.performanceData.length > 0) {
      callback(this.performanceData);
    }
  }

  getPerformanceData(): Array<{ timestamp: number; bleDeviceCount: number }> {
    return this.performanceData;
  }
}
