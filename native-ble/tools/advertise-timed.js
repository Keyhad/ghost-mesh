#!/usr/bin/env node
// Advertise for a short, configurable duration (default 30s) using bleno
const bleno = require('@abandonware/bleno');

// CLI args: [durationSeconds] [name]
const argDuration = process.argv[2];
const argName = process.argv[3];

const NAME = argName || process.env.AD_NAME || 'GhostMesh-Test';
const COMPANY_ID = parseInt(process.env.AD_COMPANY || '65535', 10); // default 0xFFFF
const PAYLOAD = Buffer.from(process.env.AD_PAYLOAD || '48656c6c6f2d476d657368', 'hex'); // 'Hello-Gmesh'

// DURATION: if CLI arg provided it's treated as seconds, otherwise AD_DURATION env (ms), else 30000ms
let DURATION = 30000;
if (argDuration) {
  const n = Number(argDuration);
  if (!Number.isNaN(n)) DURATION = Math.round(n * 1000);
} else if (process.env.AD_DURATION) {
  const envN = Number(process.env.AD_DURATION);
  if (!Number.isNaN(envN)) DURATION = envN;
}

function buildManufacturerData(companyId, payload) {
  const md = Buffer.allocUnsafe(2 + payload.length);
  md.writeUInt16LE(companyId, 0);
  payload.copy(md, 2);
  return md;
}

function buildEirField(type, dataBuf) {
  const len = 1 + dataBuf.length; // type + data
  return Buffer.concat([Buffer.from([len, type]), dataBuf]);
}

const manufacturerData = buildManufacturerData(COMPANY_ID, PAYLOAD);
const advData = buildEirField(0xff, manufacturerData); // manufacturer-specific in advertising PD

// Put the Complete Local Name into scan response so phone apps can display it
let nameBuf = Buffer.from(NAME, 'utf8');
// Reserve 2 bytes for [len,type]
const maxNameLen = Math.max(0, 31 - 2);
if (nameBuf.length > maxNameLen) {
  nameBuf = nameBuf.slice(0, maxNameLen);
}
const scanData = buildEirField(0x09, nameBuf); // 0x09 = Complete Local Name

let timedStop = null;
let globalExitTimer = null;
let advertisingStarted = false;
let fallbackTimer = null;
const FALLBACK_TIMEOUT = 2000; // ms to wait for advertisingStart before falling back
let hardExitTimer = null;

bleno.on('stateChange', (state) => {
  console.log('bleno state:', state);
  if (state === 'poweredOn') {
    // Ensure adv/scan data do not exceed 31 bytes each
    if (advData.length > 31) {
      console.warn('Advertising data exceeds 31 bytes and may be truncated by platform');
    }
    if (scanData.length > 31) {
      console.warn('Scan response data exceeds 31 bytes and may be truncated by platform');
    }
    console.log('calling startAdvertising (name + service) immediately');
    const PRIMARY_SERVICE = '12345678-1234-1234-1234-1234567890ab';
    bleno.startAdvertising(NAME, [PRIMARY_SERVICE], (err) => {
      if (err) {
        console.error('startAdvertising error:', err);
        process.exit(1);
      }
      advertisingStarted = true;
      console.log(`Advertising started (${NAME}) for ${DURATION}ms`);
      // Stop advertising after DURATION and ensure process exits even if stop callback hangs
      timedStop = setTimeout(() => {
        console.log('Timed duration elapsed — stopping advertising');
        try {
          bleno.stopAdvertising(() => {
            console.log('stopAdvertising callback invoked — exiting');
            if (hardExitTimer) clearTimeout(hardExitTimer);
            process.exit(0);
          });
        } catch (e) {
          console.error('stopAdvertising threw:', e);
          process.exit(1);
        }
        // Force exit if stopAdvertising callback not invoked within 2s
        hardExitTimer = setTimeout(() => {
          console.error('stopAdvertising callback not invoked — forcing exit');
          process.exit(0);
        }, 2000);
      }, DURATION);
    });
  } else {
    bleno.stopAdvertising();
  }
});

// Additional verbose bleno event logs to help debug advertising startup
bleno.on('advertisingStart', (error) => {
  if (error) console.error('bleno advertisingStart error:', error);
  else console.log('bleno event: advertisingStart (no error)');
  if (fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
});

bleno.on('advertisingStop', () => {
  console.log('bleno event: advertisingStop');
});

bleno.on('accept', (clientAddress) => {
  console.log('bleno event: accept from', clientAddress);
});

bleno.on('disconnect', (clientAddress) => {
  console.log('bleno event: disconnect from', clientAddress);
});

process.on('SIGINT', () => {
  if (timedStop) clearTimeout(timedStop);
  console.log('Interrupted — stopping advertising');
  if (globalExitTimer) clearTimeout(globalExitTimer);
  if (hardExitTimer) clearTimeout(hardExitTimer);
  bleno.stopAdvertising(() => process.exit(0));
});

// Global watchdog: ensure the process exits even if Bluetooth never becomes ready
const globalTimeoutMs = DURATION + 1000;
globalExitTimer = setTimeout(() => {
  if (!advertisingStarted) {
    console.error(`No advertising activity detected within ${globalTimeoutMs}ms — exiting`);
    process.exit(2);
  }
}, globalTimeoutMs);
