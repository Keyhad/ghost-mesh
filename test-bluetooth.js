// Test Bluetooth detection
const noble = require('@abandonware/noble');

console.log('Testing Bluetooth detection...');
console.log('Initial state:', noble.state);

noble.on('stateChange', (state) => {
  console.log('State changed to:', state);

  if (state === 'poweredOn') {
    console.log('✅ Bluetooth is working!');
    process.exit(0);
  } else if (state === 'unsupported') {
    console.error('❌ Bluetooth is not supported on this system');
    process.exit(1);
  } else if (state === 'unauthorized') {
    console.error('❌ Bluetooth access is unauthorized');
    process.exit(1);
  } else if (state === 'poweredOff') {
    console.error('❌ Bluetooth is powered off. Please enable it in Windows Settings.');
    process.exit(1);
  } else if (state === 'unknown') {
    console.error('❌ Bluetooth state is unknown. Possible issues:');
    console.error('  1. Bluetooth drivers may not be installed');
    console.error('  2. No Bluetooth adapter detected');
    console.error('  3. Bluetooth service not running');
    console.error('  4. Native module compilation issue');
    process.exit(1);
  }
});

// Wait 5 seconds for state change
setTimeout(() => {
  console.log('⏱️ Timeout: No state change detected after 5 seconds');
  console.log('Final state:', noble.state);
  console.log('\nPlease check:');
  console.log('  1. Device Manager → Bluetooth adapters present');
  console.log('  2. Windows Settings → Bluetooth is enabled');
  console.log('  3. Bluetooth Support Service is running (services.msc)');
  process.exit(1);
}, 5000);
