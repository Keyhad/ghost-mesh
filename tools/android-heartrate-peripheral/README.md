Android Heart Rate Peripheral Sample

This sample advertises a standard BLE Heart Rate service and packs a GhostMesh message into the Heart Rate Measurement characteristic.

How to open

- Open `tools/android-heartrate-peripheral` in Android Studio.
- Let Android Studio sync Gradle and build.

Usage

- Grant runtime permissions when prompted (Android 12+ requires `BLUETOOTH_ADVERTISE` and `BLUETOOTH_CONNECT`).
- Run the app on a physical device.
- Tap "Start Advertising".
- Use nRF Connect to connect to the device and read the Heart Rate Measurement characteristic to get the GhostMesh packet.

License: MIT
