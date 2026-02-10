/**
 * GhostMesh packet parser and assembler
 *
 * Manufacturer data layout assumed:
 * - 2 bytes LE: companyId
 * - Remaining bytes: GhostMesh base packet (31 bytes):
 *   - DST ID: 5 bytes (LE)
 *   - SRC ID: 5 bytes (LE)
 *   - MSG ID: 2 bytes (LE) -> bits 15-4: messageId (12 bits), bits 3-0: packetNumber (4 bits)
 *   - HOP COUNT: 1 byte
 *   - DATA: 18 bytes
 */

export interface MeshPacket {
  companyId: number;
  dstId: number; // 5-byte integer
  srcId: number; // 5-byte integer
  messageId: number; // 12-bit
  packetNumber: number; // 4-bit
  hopCount: number;
  data: Buffer; // up to 18 bytes
}

export interface AssembledMessage {
  messageId: number;
  srcId: number;
  dstId: number;
  packets: Map<number, Buffer>; // packetNumber -> data
  totalPackets?: number; // unknown unless signalled externally
  assembled?: Buffer;
}

function readUInt40LE(buf: Buffer, offset = 0): number {
  // Read 5 bytes little-endian into Number (safe up to > 1e12)
  const b0 = buf[offset] || 0;
  const b1 = buf[offset + 1] || 0;
  const b2 = buf[offset + 2] || 0;
  const b3 = buf[offset + 3] || 0;
  const b4 = buf[offset + 4] || 0;
  return b0 + (b1 << 8) + (b2 << 16) + (b3 << 24) + (b4 * 0x100000000);
}

export function parseMeshPacket(manufacturerBuf: Buffer): MeshPacket | null {
  if (!Buffer.isBuffer(manufacturerBuf) || manufacturerBuf.length < 2 + 31) {
    return null;
  }

  const companyId = manufacturerBuf.readUInt16LE(0);
  const payload = manufacturerBuf.slice(2);

  if (payload.length < 31) return null;

  const dstId = readUInt40LE(payload, 0);
  const srcId = readUInt40LE(payload, 5);
  const msgIdRaw = payload.readUInt16LE(10);
  const messageId = (msgIdRaw >> 4) & 0x0fff; // upper 12 bits
  const packetNumber = msgIdRaw & 0x0f; // lower 4 bits
  const hopCount = payload.readUInt8(12);
  const data = payload.slice(13, 13 + 18);

  return {
    companyId,
    dstId,
    srcId,
    messageId,
    packetNumber,
    hopCount,
    data,
  };
}

// Simple assembler that collects packets by key (srcId+messageId)
export class MessageAssembler {
  private store: Map<string, AssembledMessage> = new Map();

  keyFor(srcId: number, messageId: number) {
    return `${srcId}:${messageId}`;
  }

  pushPacket(pkt: MeshPacket): AssembledMessage | null {
    const key = this.keyFor(pkt.srcId, pkt.messageId);
    let entry = this.store.get(key);
    if (!entry) {
      entry = { messageId: pkt.messageId, srcId: pkt.srcId, dstId: pkt.dstId, packets: new Map() };
      this.store.set(key, entry);
    }

    entry.packets.set(pkt.packetNumber, pkt.data);

    // If packet numbers 0..n are present contiguous from 0 to highest, attempt assembly
    const numbers = Array.from(entry.packets.keys()).sort((a, b) => a - b);
    if (numbers.length === 0) return null;

    // Heuristic: if packet 0 exists and we have <=16 packets and they are contiguous from 0 to max
    if (numbers[0] === 0) {
      const max = numbers[numbers.length - 1];
      let contiguous = true;
      for (let i = 0; i <= max; i++) {
        if (!entry.packets.has(i)) {
          contiguous = false;
          break;
        }
      }

      if (contiguous) {
        // Concatenate
        const parts: Buffer[] = [];
        for (let i = 0; i <= max; i++) parts.push(entry.packets.get(i)!);
        const assembled = Buffer.concat(parts);
        entry.assembled = assembled;
        // keep entry for diagnostics; caller may remove it when processed
        return entry;
      }
    }

    return null;
  }

  remove(srcId: number, messageId: number) {
    this.store.delete(this.keyFor(srcId, messageId));
  }
}
