Android Peripheral Sample

This minimal sample checks whether the device supports BLE peripheral advertising and can start a simple advertisement containing the device name and manufacturer data.

How to open

- Open `tools/android-peripheral-sample` in Android Studio.
- Let Android Studio sync Gradle and build.

Usage

- Grant runtime permissions when prompted (Android 12+ requires `BLUETOOTH_ADVERTISE` and `BLUETOOTH_CONNECT`).
- Run the app on a physical device (emulator does not support BLE peripheral).
- The app displays: BLE LE support, whether the adapter exists, and whether multi-advertising is supported.
- Tap `Start/Stop Advertising` to begin advertising. The app will auto-stop after 30s.

Notes

- Many phones do not support peripheral mode — check `isMultipleAdvertisementSupported()` in the UI.
- If advertising doesn't appear in nRF Connect, try toggling Bluetooth on the phone, ensure permissions are granted, and ensure the app is in the foreground.

License: MIT
