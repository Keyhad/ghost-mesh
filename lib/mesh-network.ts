'use client';

import SimplePeer from 'simple-peer';
import { Message, Device } from './types';
import { storage } from './storage';

export class GhostMeshNetwork {
  private myPhone: string;
  private peers: Map<string, SimplePeer.Instance> = new Map();
  private devices: Device[] = [];
  private messageQueue: Message[] = [];
  private onDeviceUpdate?: (devices: Device[]) => void;
  private onMessageReceived?: (message: Message) => void;

  constructor(myPhone: string) {
    this.myPhone = myPhone;
    this.loadDevices();
  }

  private loadDevices() {
    this.devices = storage.getDevices();
  }

  setOnDeviceUpdate(callback: (devices: Device[]) => void) {
    this.onDeviceUpdate = callback;
  }

  setOnMessageReceived(callback: (message: Message) => void) {
    this.onMessageReceived = callback;
  }

  // Create a peer connection (initiator)
  createPeer(deviceId: string): SimplePeer.Instance {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
    });

    this.setupPeerHandlers(peer, deviceId);
    this.peers.set(deviceId, peer);
    return peer;
  }

  // Accept a peer connection
  acceptPeer(deviceId: string, signalData: any): SimplePeer.Instance {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
    });

    this.setupPeerHandlers(peer, deviceId);
    peer.signal(signalData);
    this.peers.set(deviceId, peer);
    return peer;
  }

  private setupPeerHandlers(peer: SimplePeer.Instance, deviceId: string) {
    peer.on('signal', (data) => {
      // In a real app, this would be sent via a signaling server
      // For now, we'll use local broadcast or manual sharing
      console.log('Signal data for', deviceId, data);
    });

    peer.on('connect', () => {
      console.log('Connected to', deviceId);
      this.updateDeviceStatus(deviceId, true);
      
      // Send pending messages for this device
      this.processPendingMessages(deviceId);
    });

    peer.on('data', (data) => {
      const message: Message = JSON.parse(data.toString());
      this.handleReceivedMessage(message);
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      this.updateDeviceStatus(deviceId, false);
    });

    peer.on('close', () => {
      console.log('Disconnected from', deviceId);
      this.updateDeviceStatus(deviceId, false);
      this.peers.delete(deviceId);
    });
  }

  private updateDeviceStatus(deviceId: string, connected: boolean) {
    const device = this.devices.find(d => d.id === deviceId);
    if (device) {
      device.connected = connected;
      device.lastSeen = Date.now();
    } else {
      this.devices.push({
        id: deviceId,
        peerId: deviceId,
        lastSeen: Date.now(),
        connected,
      });
    }
    storage.updateDevices(this.devices);
    this.onDeviceUpdate?.(this.devices);
  }

  sendMessage(dstId: string, content: string) {
    const message: Message = {
      id: `${Date.now()}-${Math.random()}`,
      srcId: this.myPhone,
      dstId,
      content,
      timestamp: Date.now(),
      hops: [this.myPhone],
      ttl: 10, // Max 10 hops
    };

    storage.addMessage(message);
    this.routeMessage(message);
  }

  private routeMessage(message: Message) {
    // If we're the destination, deliver it
    if (message.dstId === this.myPhone) {
      this.onMessageReceived?.(message);
      return;
    }

    // If TTL expired, drop it
    if (message.ttl <= 0) {
      console.log('Message TTL expired:', message.id);
      return;
    }

    // Forward to all connected peers except those in hops
    let forwarded = false;
    this.peers.forEach((peer, deviceId) => {
      if (!message.hops.includes(deviceId) && peer.connected) {
        const forwardMessage = {
          ...message,
          hops: [...message.hops, this.myPhone],
          ttl: message.ttl - 1,
        };
        
        peer.send(JSON.stringify(forwardMessage));
        forwarded = true;
      }
    });

    if (!forwarded) {
      // Queue for later if no peers available
      this.messageQueue.push(message);
    }
  }

  private handleReceivedMessage(message: Message) {
    // Store the message
    storage.addMessage(message);

    // If we're the destination, notify
    if (message.dstId === this.myPhone) {
      this.onMessageReceived?.(message);
      return;
    }

    // Otherwise, forward it
    this.routeMessage(message);
  }

  private processPendingMessages(deviceId: string) {
    const peer = this.peers.get(deviceId);
    if (!peer || !peer.connected) return;

    const remaining: Message[] = [];
    for (const message of this.messageQueue) {
      if (!message.hops.includes(deviceId)) {
        const forwardMessage = {
          ...message,
          hops: [...message.hops, this.myPhone],
          ttl: message.ttl - 1,
        };
        
        if (forwardMessage.ttl > 0) {
          peer.send(JSON.stringify(forwardMessage));
        }
      } else {
        remaining.push(message);
      }
    }
    this.messageQueue = remaining;
  }

  getConnectedDevices(): Device[] {
    return this.devices.filter(d => d.connected);
  }

  getAllDevices(): Device[] {
    return this.devices;
  }

  disconnect() {
    this.peers.forEach(peer => peer.destroy());
    this.peers.clear();
  }
}
