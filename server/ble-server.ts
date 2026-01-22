#!/usr/bin/env node
/**
 * BLE WebSocket Server
 * Bridges Web UI with native BLE mesh networking
 */

import { WebSocketServer, WebSocket } from 'ws';
import { MeshNode } from '../src/mesh';
import { Message } from '../src/protocol';
import { logger } from '../src/logger';

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 8080;

interface ClientCommand {
  type: 'init' | 'send_message' | 'get_devices' | 'disconnect';
  phoneNumber?: string;
  to?: string;
  content?: string;
}

interface ServerEvent {
  type: 'connected' | 'device_update' | 'message_received' | 'message_sent' | 'error';
  devices?: any[];
  message?: Message;
  error?: string;
}

class BLEServer {
  private wss: WebSocketServer;
  private meshNode: MeshNode | null = null;
  private clients: Set<WebSocket> = new Set();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    logger.success(`BLE WebSocket Server listening on ws://localhost:${port}`);

    this.wss.on('connection', (ws: WebSocket) => {
      logger.connection('Web client connected');
      this.clients.add(ws);

      ws.on('message', async (data: Buffer) => {
        try {
          const command: ClientCommand = JSON.parse(data.toString());
          await this.handleCommand(ws, command);
        } catch (error) {
          logger.error('Error handling command:', error);
          this.sendError(ws, 'Invalid command format');
        }
      });

      ws.on('close', () => {
        logger.connection('Web client disconnected');
        this.clients.delete(ws);

        // If no clients left, stop mesh node
        if (this.clients.size === 0 && this.meshNode) {
          logger.info('No clients connected, stopping BLE mesh...');
          this.meshNode.stop();
          this.meshNode = null;
        }
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  private async handleCommand(ws: WebSocket, command: ClientCommand) {
    logger.debug('Received command:', command.type);

    switch (command.type) {
      case 'init':
        if (!command.phoneNumber) {
          this.sendError(ws, 'Phone number required for init');
          return;
        }
        await this.initMeshNode(ws, command.phoneNumber);
        break;

      case 'send_message':
        if (!this.meshNode) {
          this.sendError(ws, 'Mesh node not initialized');
          return;
        }
        if (!command.to || !command.content) {
          this.sendError(ws, 'Destination and content required');
          return;
        }
        this.meshNode.sendMessage(command.to, command.content);
        break;

      case 'get_devices':
        if (!this.meshNode) {
          this.sendError(ws, 'Mesh node not initialized');
          return;
        }
        // Devices are sent via events, so just acknowledge
        this.send(ws, { type: 'connected' });
        break;

      case 'disconnect':
        if (this.meshNode) {
          await this.meshNode.stop();
          this.meshNode = null;
        }
        break;

      default:
        this.sendError(ws, `Unknown command: ${command.type}`);
    }
  }

  private async initMeshNode(ws: WebSocket, phoneNumber: string) {
    try {
      // Stop existing node if any
      if (this.meshNode) {
        await this.meshNode.stop();
      }

      logger.info(`Starting BLE mesh node for ${phoneNumber}...`);
      this.meshNode = new MeshNode(phoneNumber);

      // Set up event listeners
      this.meshNode.on('started', (data) => {
        logger.success('BLE mesh node started:', data);
        this.broadcast({ type: 'connected' });
      });

      this.meshNode.on('deviceDiscovered', (device) => {
        logger.ble('Device discovered:', device.id, 'Total:', device.totalCount);
        this.broadcast({
          type: 'device_update',
          devices: [{ id: device.id, totalCount: device.totalCount, connected: false, lastSeen: Date.now() }],
        });
      });

      this.meshNode.on('messageReceived', (message: Message) => {
        logger.message('Message received:', message.id);
        this.broadcast({
          type: 'message_received',
          message,
        });
      });

      this.meshNode.on('messageSent', (message: Message) => {
        logger.message('Message sent:', message.id);
        this.broadcast({
          type: 'message_sent',
          message,
        });
      });

      this.meshNode.on('error', (error) => {
        logger.error('Mesh node error:', error);
        this.broadcast({
          type: 'error',
          error: error.message || 'Unknown mesh error',
        });
      });

      // Start the mesh node
      await this.meshNode.start();

    } catch (error: any) {
      logger.error('Failed to initialize mesh node:', error);
      this.sendError(ws, `Failed to start BLE: ${error.message}`);
    }
  }

  private send(ws: WebSocket, event: ServerEvent) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  private broadcast(event: ServerEvent) {
    const data = JSON.stringify(event);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private sendError(ws: WebSocket, error: string) {
    this.send(ws, { type: 'error', error });
  }
}

// Start server
const server = new BLEServer(PORT);

// Handle process signals
process.on('SIGINT', () => {
  logger.info('\nShutting down BLE server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('\nShutting down BLE server...');
  process.exit(0);
});
