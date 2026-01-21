/**
 * Example: Simple two-node mesh communication
 * 
 * This example demonstrates:
 * - Creating two mesh nodes
 * - Sending a message from one to another
 * - Auto-relay functionality
 */

import { MeshNode } from '../src/mesh';
import { Message } from '../src/protocol';

async function runExample() {
  console.log('🚀 Starting Ghost-Mesh Example\n');

  // Create two mesh nodes with different phone numbers
  const node1 = new MeshNode('+1234567890');
  const node2 = new MeshNode('+0987654321');

  // Set up event listeners for Node 1
  node1.on('started', () => {
    console.log('✅ Node 1 (+1234567890) started');
  });

  node1.on('messageSent', (message: Message) => {
    console.log(`📤 Node 1 sent: "${message.content}" to ${message.to}`);
  });

  node1.on('messageReceived', (message: Message) => {
    console.log(`📨 Node 1 received from ${message.from}: "${message.content}"`);
  });

  node1.on('broadcast', ({ message }) => {
    console.log(`📡 Node 1 broadcasting message ${message.id.slice(0, 8)}...`);
    
    // Simulate message being received by Node 2
    // In a real BLE implementation, this would happen automatically
    const buffer = require('../src/protocol').serializeMessage(message);
    setTimeout(() => {
      // Simulate BLE discovery delay
      console.log('🔍 Node 2 discovered broadcast from Node 1');
      // In real implementation, this would be handled by BLE scanning
    }, 100);
  });

  // Set up event listeners for Node 2
  node2.on('started', () => {
    console.log('✅ Node 2 (+0987654321) started');
  });

  node2.on('messageSent', (message: Message) => {
    console.log(`📤 Node 2 sent: "${message.content}" to ${message.to}`);
  });

  node2.on('messageReceived', (message: Message) => {
    console.log(`📨 Node 2 received from ${message.from}: "${message.content}"`);
  });

  node2.on('messageRelayed', (message: Message) => {
    console.log(`🔁 Node 2 relaying message ${message.id.slice(0, 8)}... (hop ${message.hops})`);
  });

  // Start both nodes
  console.log('Starting nodes...\n');
  try {
    await node1.start();
    await node2.start();
  } catch (error) {
    console.error('Note: BLE may not be available in this environment.');
    console.log('This example shows the conceptual flow.\n');
  }

  // Wait a bit for nodes to initialize
  await new Promise(resolve => setTimeout(resolve, 500));

  // Send a message from Node 1 to Node 2
  console.log('\n📱 Sending message from Node 1 to Node 2...\n');
  node1.sendMessage('+0987654321', 'Hello from the mesh network!');

  // Wait for message to propagate
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send a reply from Node 2 to Node 1
  console.log('\n📱 Sending reply from Node 2 to Node 1...\n');
  node2.sendMessage('+1234567890', 'Reply: Message received!');

  // Wait and then clean up
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n✅ Example complete!');
  console.log('\n📊 Statistics:');
  console.log(`  Node 1 seen messages: ${node1.getSeenMessagesCount()}`);
  console.log(`  Node 2 seen messages: ${node2.getSeenMessagesCount()}`);

  // Stop nodes
  await node1.stop();
  await node2.stop();

  console.log('\n👋 Nodes stopped\n');
}

// Run the example
runExample().catch(console.error);
