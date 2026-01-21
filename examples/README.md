# Ghost-Mesh Examples

This directory contains example code demonstrating how to use Ghost-Mesh.

## Running Examples

First, build the project:

```bash
npm run build
```

Then run an example with ts-node:

```bash
npx ts-node examples/simple-mesh.ts
```

## Available Examples

### simple-mesh.ts

Demonstrates basic two-node mesh communication:
- Creating mesh nodes
- Sending messages between nodes
- Auto-relay functionality
- Event handling

This example shows the conceptual flow. In a real BLE environment, the nodes would communicate wirelessly.

## Creating Your Own Examples

You can create your own examples by:

1. Import the MeshNode class: `import { MeshNode } from '../src/mesh';`
2. Create a node: `const node = new MeshNode('+1234567890');`
3. Set up event listeners
4. Start the node: `await node.start();`
5. Send messages: `node.sendMessage('+destination', 'message');`

See the existing examples for reference.
