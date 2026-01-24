#pragma once

#include <string>
#include <vector>
#include <functional>
#include <cstdint>

namespace ghostmesh
{
  namespace ble
  {

    /**
     * BLE Adapter States
     * Matches CoreBluetooth CBManagerState
     */
    enum class BLEState
    {
      UNKNOWN = 0,      // State is unknown
      RESETTING = 1,    // Adapter is resetting
      UNSUPPORTED = 2,  // Device doesn't support BLE
      UNAUTHORIZED = 3, // App not authorized to use BLE
      POWERED_OFF = 4,  // Bluetooth is turned off
      POWERED_ON = 5    // Bluetooth is on and ready
    };

    /**
     * Advertising options
     */
    struct AdvertisingOptions
    {
      std::string name;                      // Device name (optional)
      std::vector<std::string> serviceUUIDs; // Service UUIDs to advertise
      std::vector<uint8_t> manufacturerData; // Manufacturer data (company ID + payload)
      uint32_t intervalMs;                   // Advertising interval in milliseconds
      int8_t txPowerLevel;                   // TX power level in dBm (-20 to +4)

      // Constructor with defaults
      AdvertisingOptions()
          : intervalMs(100), txPowerLevel(0) {}
    };

    /**
     * Scan options
     */
    struct ScanOptions
    {
      uint16_t filterByManufacturer;            // Filter by company ID (0 = no filter)
      std::vector<std::string> filterByService; // Filter by service UUIDs
      bool allowDuplicates;                     // Allow duplicate reports
      uint32_t duplicateTimeoutMs;              // Duplicate filter timeout in ms

      // Constructor with defaults
      ScanOptions()
          : filterByManufacturer(0), allowDuplicates(false), duplicateTimeoutMs(1000) {}
    };

    /**
     * Discovered device information
     */
    struct DiscoveredDevice
    {
      std::string address;                   // Device MAC address or UUID
      std::string name;                      // Device name (if available)
      int16_t rssi;                          // Signal strength in dBm
      std::vector<uint8_t> manufacturerData; // Manufacturer data
      std::vector<std::string> serviceUUIDs; // Advertised service UUIDs
      uint64_t timestamp;                    // Discovery timestamp (ms since epoch)

      DiscoveredDevice()
          : rssi(0), timestamp(0) {}
    };

    /**
     * Error information
     */
    struct BLEError
    {
      enum class Code
      {
        ADAPTER_UNAVAILABLE,
        ADAPTER_UNAUTHORIZED,
        ADAPTER_POWERED_OFF,
        ADVERTISING_FAILED,
        ADVERTISING_UNSUPPORTED,
        SCANNING_FAILED,
        INVALID_PARAMETER,
        PAYLOAD_TOO_LARGE,
        PLATFORM_ERROR,
        UNKNOWN_ERROR
      };

      Code code;
      std::string message;
      std::string nativeError; // Platform-specific error details

      BLEError(Code c, const std::string &msg, const std::string &native = "")
          : code(c), message(msg), nativeError(native) {}
    };

    /**
     * Platform callback types
     */
    using StateChangeCallback = std::function<void(BLEState state)>;
    using DeviceDiscoveredCallback = std::function<void(const DiscoveredDevice &device)>;
    using ErrorCallback = std::function<void(const BLEError &error)>;
    using SuccessCallback = std::function<void()>;

    /**
     * Platform interface - all platforms must implement this
     *
     * This interface abstracts the platform-specific BLE implementations:
     * - macOS: CoreBluetooth (Objective-C++)
     * - Windows: Windows.Devices.Bluetooth (WinRT C++)
     * - Linux: BlueZ D-Bus API
     */
    class IBLEPlatform
    {
    public:
      virtual ~IBLEPlatform() = default;

      /**
       * Initialize the BLE adapter
       * Should set up platform-specific resources and start monitoring adapter state
       *
       * @throws BLEError if initialization fails
       */
      virtual void Initialize() = 0;

      /**
       * Shutdown the BLE adapter
       * Should clean up all resources and stop all operations
       */
      virtual void Shutdown() = 0;

      /**
       * Get current adapter state
       *
       * @return Current BLE adapter state
       */
      virtual BLEState GetState() const = 0;

      /**
       * Set callback for adapter state changes
       * Callback will be invoked from platform-specific thread
       *
       * @param callback Function to call when state changes
       */
      virtual void SetStateChangeCallback(StateChangeCallback callback) = 0;

      /**
       * Set callback for errors
       *
       * @param callback Function to call when errors occur
       */
      virtual void SetErrorCallback(ErrorCallback callback) = 0;

      /**
       * Start BLE advertising
       *
       * @param options Advertising configuration
       * @param callback Success/failure callback
       * @throws BLEError if advertising cannot be started
       */
      virtual void StartAdvertising(const AdvertisingOptions &options,
                                    SuccessCallback callback) = 0;

      /**
       * Update advertising data without stopping
       * Should update manufacturer data in-place if possible
       *
       * @param data New manufacturer data (company ID + payload)
       * @param callback Success/failure callback
       * @throws BLEError if update fails
       */
      virtual void UpdateAdvertisingData(const std::vector<uint8_t> &data,
                                         SuccessCallback callback) = 0;

      /**
       * Stop advertising
       *
       * @param callback Success/failure callback
       */
      virtual void StopAdvertising(SuccessCallback callback) = 0;

      /**
       * Check if currently advertising
       *
       * @return true if advertising is active
       */
      virtual bool IsAdvertising() const = 0;

      /**
       * Start BLE scanning
       *
       * @param options Scan configuration
       * @param callback Success/failure callback
       * @throws BLEError if scanning cannot be started
       */
      virtual void StartScanning(const ScanOptions &options,
                                 SuccessCallback callback) = 0;

      /**
       * Set callback for discovered devices
       * Callback will be invoked from platform-specific thread
       *
       * @param callback Function to call when devices are discovered
       */
      virtual void SetDeviceDiscoveredCallback(DeviceDiscoveredCallback callback) = 0;

      /**
       * Stop scanning
       *
       * @param callback Success/failure callback
       */
      virtual void StopScanning(SuccessCallback callback) = 0;

      /**
       * Check if currently scanning
       *
       * @return true if scanning is active
       */
      virtual bool IsScanning() const = 0;

      /**
       * Get platform name for debugging
       *
       * @return Platform identifier (e.g., "CoreBluetooth", "WinRT", "BlueZ")
       */
      virtual const char *GetPlatformName() const = 0;

      /**
       * Get platform capabilities
       * Allows querying what features are supported
       */
      struct Capabilities
      {
        bool supportsExtendedAdvertising; // BLE 5.0 Extended Advertising
        uint16_t maxAdvertisingDataSize;  // Maximum advertising payload size
        bool supportsSimultaneousAdvScan; // Can advertise and scan at same time
        bool supportsMultipleAdvSets;     // Multiple advertising sets (BLE 5.0)
      };

      virtual Capabilities GetCapabilities() const = 0;
    };

    /**
     * Factory function to create platform-specific implementation
     * Implementation is in ble_platform_factory.cpp
     *
     * @return Platform-specific BLE implementation
     * @throws BLEError if platform is not supported
     */
    std::unique_ptr<IBLEPlatform> CreateBLEPlatform();

  } // namespace ble
} // namespace ghostmesh
