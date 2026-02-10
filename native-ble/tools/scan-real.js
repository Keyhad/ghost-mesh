#!/usr/bin/env node
/*
 * Real BLE scanner using @abandonware/noble
 * Prints advertisement objects and attempts to parse manufacturer/mesh fields
 *
 * Usage:
 *   npm install @abandonware/noble
 *   npm run scan:real
 */

const noble = require('@abandonware/noble');
const { parseManufacturerData, parseMeshPacket } = require('../dist');

function bufToHex(buf) {
  if (!buf) return null;
  return Buffer.from(buf).toString('hex');
}

console.log('Starting real BLE scan...');

noble.on('stateChange', (state) => {
  console.log('Noble state:', state);
  if (state === 'poweredOn') {
    noble.startScanning([], true, (err) => {
      if (err) console.error('startScanning error', err);
    });
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', (peripheral) => {
  try {
    const adv = peripheral.advertisement || {};
    const manufacturerData = adv.manufacturerData || null;
    let parsed = null;
    let mesh = null;
    try {
      if (manufacturerData) parsed = parseManufacturerData(manufacturerData);
    } catch (e) {}
    try {
      if (manufacturerData) mesh = parseMeshPacket(manufacturerData);
    } catch (e) {}

    const out = {
      id: peripheral.id,
      address: peripheral.address,
      localName: adv.localName,
      rssi: peripheral.rssi,
      serviceUuids: adv.serviceUuids,
      manufacturerData: bufToHex(manufacturerData),
      manufacturerParsed: parsed,
      meshPacket: mesh,
    };

    console.log('DISCOVERED:', JSON.stringify(out, null, 2));
  } catch (err) {
    console.error('Error handling discover:', err);
  }
});
