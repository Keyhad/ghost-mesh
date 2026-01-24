#include "ble_platform.h"
#include <stdexcept>

namespace ghostmesh
{
  namespace ble
  {

    /**
     * Platform factory implementation
     * Conditionally compiles the appropriate platform based on OS macros
     */

#ifdef __APPLE__
// macOS - Use CoreBluetooth
#include "macos/ble_platform_macos.h"

    std::unique_ptr<IBLEPlatform> CreateBLEPlatform()
    {
      return std::make_unique<BLEPlatformMacOS>();
    }

#elif _WIN32
// Windows - Use WinRT Bluetooth APIs
#include "windows/ble_platform_windows.h"

    std::unique_ptr<IBLEPlatform> CreateBLEPlatform()
    {
      return std::make_unique<BLEPlatformWindows>();
    }

#elif __linux__
// Linux - Use BlueZ D-Bus API
#include "linux/ble_platform_linux.h"

    std::unique_ptr<IBLEPlatform> CreateBLEPlatform()
    {
      return std::make_unique<BLEPlatformLinux>();
    }

#else
    // Unsupported platform
    std::unique_ptr<IBLEPlatform> CreateBLEPlatform()
    {
      throw BLEError(
          BLEError::Code::PLATFORM_ERROR,
          "Platform not supported. Only macOS, Windows, and Linux are supported.",
          "UNSUPPORTED_PLATFORM");
    }

#endif

  } // namespace ble
} // namespace ghostmesh
