/**
 * GhostMesh Native BLE Module
 *
 * Cross-platform native BLE adapter for advertising and scanning
 * without GATT connections or pairing.
 */

export { BLEAdapter } from './adapter';
export type { IBLEAdapterNative } from './adapter';
export {
  BLEError,
  type BLEState,
  type BLEErrorCode,
  type AdvertisingOptions,
  type ScanOptions,
  type DiscoveredDevice,
  type BLEAdapterEvents,
} from './types';

export { parseManufacturerData } from './manufacturer';
export { parseMeshPacket, MessageAssembler, type MeshPacket } from './mesh';
