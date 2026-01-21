#!/usr/bin/env node
/**
 * Ghost-Mesh CLI
 * Command-line interface for the decentralized mesh chat
 */

import * as readline from 'readline';
import { MeshNode } from './mesh';
import { Message, MAX_HOPS } from './protocol';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let meshNode: MeshNode | null = null;

function displayBanner(): void {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║               👻 GHOST-MESH v1.0                     ║');
  console.log('║   Decentralized Off-Grid Mesh Chat via BLE          ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
}

function displayHelp(): void {
  console.log('\nAvailable commands:');
  console.log('  /register <phone>  - Register your phone number (e.g., /register +1234567890)');
  console.log('  /send <to> <msg>   - Send a message (e.g., /send +9876543210 Hello!)');
  console.log('  /status            - Show node status');
  console.log('  /help              - Show this help');
  console.log('  /quit              - Exit the application\n');
}

function displayStatus(): void {
  if (!meshNode) {
    console.log('❌ Node not registered. Use /register <phone> to start.');
    return;
  }
  
  console.log('\n📊 Node Status:');
  console.log(`  Phone Number: ${meshNode.getPhoneNumber()}`);
  console.log(`  Messages Seen: ${meshNode.getSeenMessagesCount()}`);
  console.log('  Status: Active\n');
}

async function registerNode(phoneNumber: string): Promise<void> {
  if (meshNode) {
    console.log('⚠️  Node already registered. Restart to change phone number.');
    return;
  }

  if (!phoneNumber.match(/^\+?[0-9]{7,15}$/)) {
    console.log('❌ Invalid phone number format. Use international format (e.g., +1234567890)');
    return;
  }

  console.log(`📱 Registering node with phone number: ${phoneNumber}`);
  meshNode = new MeshNode(phoneNumber);

  // Set up event listeners
  meshNode.on('started', () => {
    console.log('✅ Mesh node started successfully!');
    console.log('🔍 Scanning for nearby nodes...\n');
  });

  meshNode.on('messageReceived', (message: Message) => {
    console.log(`\n📨 Message from ${message.from}:`);
    console.log(`   ${message.content}`);
    console.log(`   (${new Date(message.timestamp).toLocaleString()})\n`);
    displayPrompt();
  });

  meshNode.on('messageSent', (message: Message) => {
    console.log(`✅ Message sent to ${message.to}`);
  });

  meshNode.on('messageRelayed', (message: Message) => {
    console.log(`🔁 Relayed message ${message.id.slice(0, 8)}... (hop ${message.hops}/${MAX_HOPS})`);
  });

  meshNode.on('broadcast', ({ message }) => {
    // In a real implementation, this would trigger BLE advertising
    console.log(`📡 Broadcasting message ${message.id.slice(0, 8)}...`);
  });

  try {
    await meshNode.start();
  } catch (error) {
    console.error('❌ Failed to start node:', error);
    meshNode = null;
  }
}

function sendMessage(args: string[]): void {
  if (!meshNode) {
    console.log('❌ Node not registered. Use /register <phone> first.');
    return;
  }

  if (args.length < 2) {
    console.log('❌ Usage: /send <phone> <message>');
    return;
  }

  const to = args[0];
  const content = args.slice(1).join(' ');

  if (!to.match(/^\+?[0-9]{7,15}$/)) {
    console.log('❌ Invalid recipient phone number format.');
    return;
  }

  meshNode.sendMessage(to, content);
}

function displayPrompt(): void {
  process.stdout.write('ghost-mesh> ');
}

async function handleCommand(input: string): Promise<void> {
  const trimmed = input.trim();
  
  if (!trimmed) {
    displayPrompt();
    return;
  }

  if (!trimmed.startsWith('/')) {
    console.log('❌ Commands must start with /. Type /help for available commands.');
    displayPrompt();
    return;
  }

  const parts = trimmed.split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  switch (command) {
    case '/register':
      if (args.length === 0) {
        console.log('❌ Usage: /register <phone>');
      } else {
        await registerNode(args[0]);
      }
      break;
    
    case '/send':
      sendMessage(args);
      break;
    
    case '/status':
      displayStatus();
      break;
    
    case '/help':
      displayHelp();
      break;
    
    case '/quit':
      console.log('\n👋 Shutting down ghost-mesh...');
      if (meshNode) {
        await meshNode.stop();
      }
      process.exit(0);
      break;
    
    default:
      console.log(`❌ Unknown command: ${command}. Type /help for available commands.`);
  }

  displayPrompt();
}

// Main entry point
async function main(): Promise<void> {
  displayBanner();
  displayHelp();
  displayPrompt();

  rl.on('line', async (input) => {
    await handleCommand(input);
  });

  rl.on('close', async () => {
    console.log('\n👋 Goodbye!');
    if (meshNode) {
      await meshNode.stop();
    }
    process.exit(0);
  });
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
});

main();
