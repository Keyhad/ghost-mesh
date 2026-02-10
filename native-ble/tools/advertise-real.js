#!/usr/bin/env node
// Advertise a recognisable manufacturer payload using bleno
// Usage: npm run advertise:real

const bleno = require('@abandonware/bleno');

const NAME = 'GhostMesh-Test';
const COMPANY_ID = 0xFFFF; // test company id
const PAYLOAD = Buffer.from('48656c6c6f2d476d657368', 'hex'); // 'Hello-Gmesh' hex

function buildManufacturerData(companyId, payload) {
  const md = Buffer.allocUnsafe(2 + payload.length);
  md.writeUInt16LE(companyId, 0);
  payload.copy(md, 2);
  return md;
}

const manufacturerData = buildManufacturerData(COMPANY_ID, PAYLOAD);

function buildEir(manufacturerBuf) {
  // AD structure: [len, type, data...]
  const type = 0xFF; // manufacturer specific data
  const len = manufacturerBuf.length + 1; // type byte included
  return Buffer.concat([Buffer.from([len, type]), manufacturerBuf]);
}

const advData = buildEir(manufacturerData);
const scanData = Buffer.alloc(0);

bleno.on('stateChange', (state) => {
  console.log('bleno stateChange:', state);
  if (state === 'poweredOn') {
    try {
      bleno.startAdvertisingWithEIRData(advData, scanData, (err) => {
        if (err) {
          console.error('startAdvertisingWithEIRData error:', err);
          process.exit(1);
        }
        console.log('Advertising started. Look for', NAME, 'with manufacturer data', manufacturerData.toString('hex'));
      });
    } catch (e) {
      console.error('advertise error', e);
      process.exit(1);
    }
  } else {
    bleno.stopAdvertising();
  }
});

process.on('SIGINT', () => {
  console.log('Stopping advertising...');
  bleno.stopAdvertising(() => process.exit(0));
});
