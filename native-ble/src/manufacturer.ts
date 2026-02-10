export interface ManufacturerInfo {
  companyId: number;
  payload: Buffer;
  message?: string;
}

/**
 * Parse manufacturer data buffer into ManufacturerInfo
 * Manufacturer data layout (assumed):
 * - 2 bytes LE company id
 * - remaining bytes: product-specific payload
 * If payload contains a UTF-8 encoded message prefixed by a length byte, parse it.
 */
export function parseManufacturerData(buf: Buffer): ManufacturerInfo {
  if (!Buffer.isBuffer(buf) || buf.length < 2) {
    throw new Error('Invalid manufacturer data');
  }
  const companyId = buf.readUInt16LE(0);
  const payload = buf.slice(2);
  const info: ManufacturerInfo = { companyId, payload };

  // If payload starts with a length byte and the rest matches that length, parse message
  if (payload.length >= 1) {
    const len = payload[0];
    if (payload.length >= 1 + len) {
      try {
        const msgBuf = payload.slice(1, 1 + len);
        info.message = msgBuf.toString('utf8');
      } catch (e) {
        // ignore parse errors
      }
    }
  }

  return info;
}
