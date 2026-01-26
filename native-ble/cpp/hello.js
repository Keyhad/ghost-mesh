// Test loading the native addon
const path = require('path');
const addon = require(path.join(__dirname, './build/Release/ble_addon.node'));
console.log(addon.hello());
