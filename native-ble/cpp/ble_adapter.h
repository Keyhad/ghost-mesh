#ifndef NATIVE_BLE_BLE_ADAPTER_H
#define NATIVE_BLE_BLE_ADAPTER_H

#include <napi.h>
#include <iostream>
#include <unordered_map>
#include <vector>

/**
 * @file ble_adapter.h
 * @brief Declaration of BLEAdapter native addon class (macOS stub)
 */

/**
 * @class BLEAdapter
 * @brief Native BLE Adapter stub for macOS (Node.js N-API)
 *
 * Implements a stub BLE adapter for testing and development, with event emitter
 * and state logic. Methods are defined in ble_adapter.cc.
 */
class BLEAdapter : public Napi::ObjectWrap<BLEAdapter>
{
public:
  /**
   * @enum State
   * @brief BLE adapter power state
   */
  enum class State
  {
    Unknown,   ///< Unknown state
    PoweredOn, ///< Adapter is powered on
    PoweredOff ///< Adapter is powered off
  };

  /**
   * @brief Construct a BLEAdapter object
   * @param info N-API callback info
   */
  BLEAdapter(const Napi::CallbackInfo &info);
  /**
   * @brief Destructor unregisters the adapter from the global registry
   */
  ~BLEAdapter();

  /**
   * @brief Initialize BLEAdapter class and export to Node.js
   * @param env N-API environment
   * @param exports N-API exports object
   * @return N-API exports object
   */
  static Napi::Object Init(Napi::Env env, Napi::Object exports);

  /**
   * @brief Register an event listener
   * @param info [0]: event name (string), [1]: callback (function)
   * @return undefined
   */
  Napi::Value On(const Napi::CallbackInfo &info);

  /**
   * @brief Emit an event to all registered listeners
   * @param info [0]: event name (string), [1...]: event arguments
   * @return undefined
   */
  Napi::Value Emit(const Napi::CallbackInfo &info);

  /**
   * @brief Emit an event programmatically (internal helper)
   * @param env Napi environment
   * @param event Event name
   * @param args Optional argument list
   */
  void EmitEvent(Napi::Env env, const std::string &event, const std::vector<napi_value> &args = {});

  /**
   * @brief Get current BLE adapter state (stub with error simulation)
   * @param info N-API callback info
   * @return BLE state as string or throws error if simulated
   */
  Napi::Value GetState(const Napi::CallbackInfo &info);

  /**
   * @brief Start BLE advertising (stub)
   * @param info N-API callback info
   * @return undefined
   */
  Napi::Value StartAdvertising(const Napi::CallbackInfo &info);

  /**
   * @brief Update advertising data (stub)
   * @param info N-API callback info
   * @return undefined
   */
  Napi::Value UpdateAdvertisingData(const Napi::CallbackInfo &info);

  /**
   * @brief Stop BLE advertising (stub)
   * @param info N-API callback info
   * @return undefined
   */
  Napi::Value StopAdvertising(const Napi::CallbackInfo &info);

  /**
   * @brief Start BLE scanning (stub)
   * @param info N-API callback info
   * @return undefined
   */
  Napi::Value StartScanning(const Napi::CallbackInfo &info);

  /**
   * @brief Stop BLE scanning (stub)
   * @param info N-API callback info
   * @return undefined
   */
  Napi::Value StopScanning(const Napi::CallbackInfo &info);

  /**
   * @brief Destroy BLE adapter (stub)
   * @param info N-API callback info
   * @return undefined
   */
  Napi::Value Destroy(const Napi::CallbackInfo &info);

  /**
   * @brief Check if advertising is active
   * @param info N-API callback info
   * @return true if advertising, false otherwise
   */
  Napi::Value IsAdvertisingActive(const Napi::CallbackInfo &info);

  /**
   * @brief Check if scanning is active
   * @param info N-API callback info
   * @return true if scanning, false otherwise
   */
  Napi::Value IsScanningActive(const Napi::CallbackInfo &info);

  /**
   * @brief Handle power state transitions, resetting flags and emitting events as needed
   * @param newState The new state name ("poweredOn"/"poweredOff")
   * @param env Napi environment
   * @param thisObj JS `this` object
   */
  static void HandlePowerStateChange(const std::string &newState, Napi::Env env, Napi::Object thisObj);

  /**
   * @brief N-API constructor reference for BLEAdapter
   */
  static Napi::FunctionReference constructor;

  /**
   * @brief Hardware adapter identifier for this instance
   */
  std::string adapterId_;

  /**
   * @brief Registry of active adapter instances by id
   */
  static std::unordered_map<std::string, BLEAdapter *> adapters_;

public:
  /**
   * @brief Lookup an adapter instance by hardware id
   * @param id Adapter identifier
   * @return pointer to BLEAdapter or nullptr if not found
   */
  static BLEAdapter *GetAdapter(const std::string &id);

private:
  /**
   * @brief Event listeners map: event name -> vector of callbacks
   */
  std::unordered_map<std::string, std::vector<Napi::FunctionReference>> listeners_;

  /**
   * @brief Current BLE adapter state
   */
  State state_;
  bool advertising_;
  bool scanning_;

  /**
   * @brief Manufacturer data for device discovery
   */
  Napi::Reference<Napi::Value> manufacturerData_;
};

#endif // NATIVE_BLE_BLE_ADAPTER_H
