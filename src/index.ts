/**
 * Ghost-Mesh - Decentralized Off-Grid Mesh Chat
 *
 * Main entry point for the library
 */

export { MeshNode } from './mesh';
export {
  type Message,
  serializeMessage,
  deserializeMessage,
  generateMessageId,
  phoneNumberMatches,
  MAX_HOPS,
  MESSAGE_VERSION
} from './protocol';
