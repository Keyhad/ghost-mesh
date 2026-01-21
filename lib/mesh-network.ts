'use client';

import { Message, Device } from './types';
import { storage } from './storage';

const WS_URL = process.env.NEXT_PUBLIC_BLE_WS_URL || 'ws://localhost:8080';

interface ServerEvent {
  type: 'connected' | 'device_update' | 'message_received' | 'message_sent' | 'error';
  devices?: any[];
  message?: any;
  error?: string;
}

export class GhostMeshNetwork {
  private myPhone: string;
  private ws: WebSocket | null = null;
  private devices: Device[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private onDeviceUpdate?: (devices: Device[]) => void;
  private onMessageReceived?: (message: Message) => void;

  constructor(myPhone: string) {
    this.myPhone = myPhone;
    this.loadDevices();
    this.connectWebSocket();
  }

  private loadDevices() {
    this.devices = storage.getDevices();
  }

  private connectWebSocket() {
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

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('🔌 Disconnected from BLE server');
        this.ws = null;
        this.attemptReconnect();
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached. Please start the BLE server.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.reconnectTimeout = setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }

  private handleServerEvent(event: ServerEvent) {
    switch (event.type) {
      case 'connected':
        console.log('✅ BLE mesh node initialized');
        break;

      case 'device_update':
        if (event.devices) {
          this.updateDevices(event.devices);
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
        break;

      default:
        console.warn('Unknown server event:', event.type);
    }
  }

  private updateDevices(newDevices: any[]) {
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
  }

  private sendCommand(command: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command));
    } else {
      console.warn('⚠️ WebSocket not connected, command queued');
    }
  }

  setOnDeviceUpdate(callback: (devices: Device[]) => void) {
    this.onDeviceUpdate = callback;
  }

  setOnMessageReceived(callback: (message: Message) => void) {
    this.onMessageReceived = callback;
  }

  sendMessage(dstId: string, content: string) {
    const message: Message = {
      id: `${Date.now()}-${Math.random()}`,
      srcId: this.myPhone,
      dstId,
      content,
      timestamp: Date.now(),
      hops: [this.myPhone],
      ttl: 10,
    };

    storage.addMessage(message);

    // Send via WebSocket to BLE server
    this.sendCommand({
      type: 'send_message',
      to: dstId,
      content,
    });
  }

  private handleReceivedMessage(message: Message) {
    // Store the message
    storage.addMessage(message);

    // If we're the destination, notify
    if (message.dstId === this.myPhone) {
      this.onMessageReceived?.(message);
    }
  }

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

    if (this.ws) {
      this.sendCommand({ type: 'disconnect' });
      this.ws.close();
      this.ws = null;
    }
  }
}
