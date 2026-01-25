/**
 * @file ble_adapter.cc
 * @brief BLEAdapter Native Addon (macOS stub)
 *
 * Implements basic BLE control functions for Node.js via N-API.
 * Platform: macOS (x64) - stub implementation, ready for CoreBluetooth integration.
 */

#include <napi.h>
#include <iostream>
#include <unordered_map>
#include <vector>

Napi::Value HelloWorld(const Napi::CallbackInfo &info);


/**
 * @class BLEAdapter
 * @brief Native BLE Adapter stub for macOS (Node.js N-API)
 *
 * Implements a stub BLE adapter for testing and development, with event emitter and state logic.
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
    Unknown,      ///< Unknown state
    PoweredOn,    ///< Adapter is powered on
    PoweredOff    ///< Adapter is powered off
  };

  /**
   * @brief N-API constructor reference for BLEAdapter
   */
  static Napi::FunctionReference constructor;

  /**
   * @brief BLEAdapter constructor
   * @param info N-API callback info
   */
  BLEAdapter(const Napi::CallbackInfo &info)
      : Napi::ObjectWrap<BLEAdapter>(info),
        state_(State::PoweredOn),
        advertising_(false),
        scanning_(false)
  {
  }

  /**
   * @brief Initialize BLEAdapter class and export to Node.js
   * @param env N-API environment
   * @param exports N-API exports object
   * @return N-API exports object
   */
  static Napi::Object Init(Napi::Env env, Napi::Object exports)
  {
    Napi::Function func = DefineClass(env, "BLEAdapter",
                                      {
                                          InstanceMethod("getState", &BLEAdapter::GetState),
                                          InstanceMethod("startAdvertising", &BLEAdapter::StartAdvertising),
                                          InstanceMethod("updateAdvertisingData", &BLEAdapter::UpdateAdvertisingData),
                                          InstanceMethod("stopAdvertising", &BLEAdapter::StopAdvertising),
                                          InstanceMethod("startScanning", &BLEAdapter::StartScanning),
                                          InstanceMethod("stopScanning", &BLEAdapter::StopScanning),
                                          InstanceMethod("destroy", &BLEAdapter::Destroy),
                                          InstanceMethod("on", &BLEAdapter::On),
                                          InstanceMethod("emit", &BLEAdapter::Emit),
                                          InstanceMethod("isAdvertisingActive", &BLEAdapter::IsAdvertisingActive),
                                          InstanceMethod("isScanningActive", &BLEAdapter::IsScanningActive),
                                      });
    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();
    exports.Set("BLEAdapter", func);
    return exports;
  }

  /**
   * @brief Register an event listener
   * @param info [0]: event name (string), [1]: callback (function)
   * @return undefined
   */
  Napi::Value On(const Napi::CallbackInfo &info)
  {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsFunction())
    {
      Napi::TypeError::New(env, "Expected event name and callback").ThrowAsJavaScriptException();
      return env.Undefined();
    }
    std::string event = info[0].As<Napi::String>();
    Napi::Function callback = info[1].As<Napi::Function>();
    listeners_[event].push_back(Napi::Persistent(callback));
    return env.Undefined();
  }

  /**
   * @brief Emit an event to all registered listeners
   * @param info [0]: event name (string), [1...]: event arguments
   * @return undefined
   */
  Napi::Value Emit(const Napi::CallbackInfo &info)
  {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString())
    {
      Napi::TypeError::New(env, "Expected event name").ThrowAsJavaScriptException();
      return env.Undefined();
    }
    std::string event = info[0].As<Napi::String>();
    auto it = listeners_.find(event);
    if (it != listeners_.end())
    {
      std::vector<napi_value> args;
      for (size_t i = 1; i < info.Length(); ++i)
      {
        args.push_back(info[i]);
      }
      for (auto &cb : it->second)
      {
        cb.Call(info.This(), args);
      }
    }
    return env.Undefined();
  }

  /**
   * @brief Get current BLE adapter state (stub with error simulation)
   * @param info N-API callback info
   * @return BLE state as string or throws error if simulated
   */
  Napi::Value GetState(const Napi::CallbackInfo &info)
  {
    Napi::Env env = info.Env();
    std::cout << "getState() called" << std::endl;
    // Simulate error if first argument is string 'error', or simulate state changes
    if (info.Length() > 0 && info[0].IsString())
    {
      std::string arg = info[0].As<Napi::String>().Utf8Value();
      if (arg == "error")
      {
        Napi::Error::New(env, "Native BLE error: failed to get state").ThrowAsJavaScriptException();
        return env.Undefined();
      }
      if (arg == "powerOff")
      {
        if (state_ != State::PoweredOff)
        {
          state_ = State::PoweredOff;
          bool wasAdvertising = advertising_;
          bool wasScanning = scanning_;
          advertising_ = false;
          scanning_ = false;
          manufacturerData_.Reset();
          auto emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
          if (wasAdvertising)
          {
            emit.Call(info.This(), {Napi::String::New(env, "advertisingStopped")});
          }
          if (wasScanning)
          {
            emit.Call(info.This(), {Napi::String::New(env, "scanningStopped")});
          }
          emit.Call(info.This(), {Napi::String::New(env, "stateChange"), Napi::String::New(env, "poweredOff")});
        }
      }
      else if (arg == "powerOn")
      {
        if (state_ != State::PoweredOn)
        {
          state_ = State::PoweredOn;
          auto emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
          emit.Call(info.This(), {Napi::String::New(env, "stateChange"), Napi::String::New(env, "poweredOn")});
        }
      }
    }
    // Return current state as string
    switch (state_)
    {
    case State::PoweredOn:
      return Napi::String::New(env, "poweredOn");
    case State::PoweredOff:
      return Napi::String::New(env, "poweredOff");
    default:
      return Napi::String::New(env, "unknown");
    }
  }

  /**
   * @brief Start BLE advertising (stub)
   * @param info N-API callback info
   * @return undefined
   */
  Napi::Value StartAdvertising(const Napi::CallbackInfo &info)
  {
    std::cout << "startAdvertising() called" << std::endl;
    if (state_ != State::PoweredOn)
    {
      Napi::Error::New(info.Env(), "Cannot start advertising: adapter not powered on").ThrowAsJavaScriptException();
      return info.Env().Undefined();
    }
    if (advertising_)
    {
      Napi::Error::New(info.Env(), "Already advertising").ThrowAsJavaScriptException();
      return info.Env().Undefined();
    }
    advertising_ = true;
    // Track manufacturer data for deviceDiscovered
    if (info[0].IsObject())
    {
      Napi::Object opts = info[0].As<Napi::Object>();
      if (opts.Has("manufacturerData"))
      {
        manufacturerData_ = Napi::Persistent(opts.Get("manufacturerData"));
      }
      else
      {
        manufacturerData_.Reset();
      }
    }
    else
    {
      manufacturerData_.Reset();
    }
    auto emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
    emit.Call(info.This(), {Napi::String::New(info.Env(), "advertisingStarted"), info[0].IsObject() ? info[0] : info.Env().Undefined()});
    return info.Env().Undefined();
  }

  /**
   * @brief Update advertising data (stub)
   * @param info N-API callback info
   * @return undefined
   */
  Napi::Value UpdateAdvertisingData(const Napi::CallbackInfo &info)
  {
    std::cout << "updateAdvertisingData() called" << std::endl;
    // Emit advertisingDataUpdated event
    auto emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
    emit.Call(info.This(), {Napi::String::New(info.Env(), "advertisingDataUpdated"), info[0]});
    // Update manufacturer data
    manufacturerData_ = Napi::Persistent(info[0]);
    // If scanning is active, emit deviceDiscovered with updated data
    if (scanning_)
    {
      Napi::Object device = Napi::Object::New(info.Env());
      device.Set("address", Napi::String::New(info.Env(), "AA:BB:CC:DD:EE:FF"));
      device.Set("name", Napi::String::New(info.Env(), "TestAdvertiser"));
      device.Set("manufacturerData", info[0]);
      emit.Call(info.This(), {Napi::String::New(info.Env(), "deviceDiscovered"), device});
    }
    return info.Env().Undefined();
  }

  /**
   * @brief Stop BLE advertising (stub)
   * @param info N-API callback info
   * @return undefined
   */
  Napi::Value StopAdvertising(const Napi::CallbackInfo &info)
  {
    std::cout << "stopAdvertising() called" << std::endl;
    if (!advertising_)
    {
      Napi::Error::New(info.Env(), "Not advertising").ThrowAsJavaScriptException();
      return info.Env().Undefined();
    }
    advertising_ = false;
    manufacturerData_.Reset();
    auto emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
    emit.Call(info.This(), {Napi::String::New(info.Env(), "advertisingStopped")});
    return info.Env().Undefined();
  }

  /**
   * @brief Start BLE scanning (stub)
   * @param info N-API callback info
   * @return undefined
   */
  Napi::Value StartScanning(const Napi::CallbackInfo &info)
  {
    std::cout << "startScanning() called" << std::endl;
    if (state_ != State::PoweredOn)
    {
      Napi::Error::New(info.Env(), "Cannot start scanning: adapter not powered on").ThrowAsJavaScriptException();
      return info.Env().Undefined();
    }
    if (scanning_)
    {
      Napi::Error::New(info.Env(), "Already scanning").ThrowAsJavaScriptException();
      return info.Env().Undefined();
    }
    scanning_ = true;
    auto emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
    emit.Call(info.This(), {Napi::String::New(info.Env(), "scanningStarted"), info[0].IsObject() ? info[0] : info.Env().Undefined()});
    // Emit deviceDiscovered event with current manufacturer data if available
    Napi::Object device = Napi::Object::New(info.Env());
    device.Set("address", Napi::String::New(info.Env(), "AA:BB:CC:DD:EE:FF"));
    device.Set("name", Napi::String::New(info.Env(), "TestAdvertiser"));
    if (!manufacturerData_.IsEmpty())
    {
      device.Set("manufacturerData", manufacturerData_.Value());
    }
    else
    {
      uint8_t mdata[4] = {0xFF, 0xFF, 0x01, 0x02};
      device.Set("manufacturerData", Napi::Buffer<uint8_t>::Copy(info.Env(), mdata, 4));
    }
    emit.Call(info.This(), {Napi::String::New(info.Env(), "deviceDiscovered"), device});
    return info.Env().Undefined();
  }

  /**
   * @brief Stop BLE scanning (stub)
   * @param info N-API callback info
   * @return undefined
   */
  Napi::Value StopScanning(const Napi::CallbackInfo &info)
  {
    std::cout << "stopScanning() called" << std::endl;
    if (!scanning_)
    {
      Napi::Error::New(info.Env(), "Not scanning").ThrowAsJavaScriptException();
      return info.Env().Undefined();
    }
    scanning_ = false;
    auto emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
    emit.Call(info.This(), {Napi::String::New(info.Env(), "scanningStopped")});
    return info.Env().Undefined();
  }

  /**
   * @brief Destroy BLE adapter (stub)
   * @param info N-API callback info
   * @return undefined
   */
  Napi::Value Destroy(const Napi::CallbackInfo &info)
  {
    std::cout << "destroy() called" << std::endl;
    advertising_ = false;
    scanning_ = false;
    manufacturerData_.Reset();
    listeners_.clear();
    return info.Env().Undefined();
  }

  /**
   * @brief Check if advertising is active
   * @param info N-API callback info
   * @return true if advertising, false otherwise
   */
  Napi::Value IsAdvertisingActive(const Napi::CallbackInfo &info)
  {
    return Napi::Boolean::New(info.Env(), advertising_);
  }

  /**
   * @brief Check if scanning is active
   * @param info N-API callback info
   * @return true if scanning, false otherwise
   */
  Napi::Value IsScanningActive(const Napi::CallbackInfo &info)
  {
    return Napi::Boolean::New(info.Env(), scanning_);
  }

private:
  /**
   * @brief Event listeners map: event name -> vector of callbacks
   */
  std::unordered_map<std::string, std::vector<Napi::FunctionReference>> listeners_;

  /**
   * @brief Current BLE adapter state
   */
  State state_;

  /**
   * @brief Advertising state
   */
  bool advertising_;

  /**
   * @brief Scanning state
   */
  bool scanning_;

  /**
   * @brief Manufacturer data for device discovery
   */
  Napi::Reference<Napi::Value> manufacturerData_;
};

Napi::FunctionReference BLEAdapter::constructor;

/**
 * @brief Get current BLE adapter state (stub with error simulation)
 * @param info N-API callback info
 * @return BLE state as string or throws error if simulated
 */
Napi::Value GetState(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  std::cout << "getState() called" << std::endl;
  // Simulate error if first argument is string 'error', or simulate state changes
  if (info.Length() > 0 && info[0].IsString())
  {
    std::string arg = info[0].As<Napi::String>().Utf8Value();
    if (arg == "error")
    {
      Napi::Error::New(env, "Native BLE error: failed to get state").ThrowAsJavaScriptException();
      return env.Undefined();
    }
    if (arg == "powerOff")
    {
      if (state_ != State::PoweredOff)
      {
        state_ = State::PoweredOff;
        bool wasAdvertising = advertising_;
        bool wasScanning = scanning_;
        advertising_ = false;
        scanning_ = false;
        manufacturerData_.Reset();
        auto emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
        if (wasAdvertising)
        {
          emit.Call(info.This(), {Napi::String::New(env, "advertisingStopped")});
        }
        if (wasScanning)
        {
          emit.Call(info.This(), {Napi::String::New(env, "scanningStopped")});
        }
        emit.Call(info.This(), {Napi::String::New(env, "stateChange"), Napi::String::New(env, "poweredOff")});
      }
    }
    else if (arg == "powerOn")
    {
      if (state_ != State::PoweredOn)
      {
        state_ = State::PoweredOn;
        auto emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
        emit.Call(info.This(), {Napi::String::New(env, "stateChange"), Napi::String::New(env, "poweredOn")});
      }
    }
  }
  // Return current state as string
  switch (state_)
  {
  case State::PoweredOn:
    return Napi::String::New(env, "poweredOn");
  case State::PoweredOff:
    return Napi::String::New(env, "poweredOff");
  default:
    return Napi::String::New(env, "unknown");
  }
}

/**
 * @brief Start BLE advertising (stub)
 * @param info N-API callback info
 * @return undefined
 */
Napi::Value StartAdvertising(const Napi::CallbackInfo &info)
{
  std::cout << "startAdvertising() called" << std::endl;
  if (state_ != State::PoweredOn)
  {
    Napi::Error::New(info.Env(), "Cannot start advertising: adapter not powered on").ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }
  if (advertising_)
  {
    Napi::Error::New(info.Env(), "Already advertising").ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }
  advertising_ = true;
  // Track manufacturer data for deviceDiscovered
  if (info[0].IsObject())
  {
    Napi::Object opts = info[0].As<Napi::Object>();
    if (opts.Has("manufacturerData"))
    {
      manufacturerData_ = Napi::Persistent(opts.Get("manufacturerData"));
    }
    else
    {
      manufacturerData_.Reset();
    }
  }
  else
  {
    manufacturerData_.Reset();
  }
  auto emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
  emit.Call(info.This(), {Napi::String::New(info.Env(), "advertisingStarted"), info[0].IsObject() ? info[0] : info.Env().Undefined()});
  return info.Env().Undefined();
}

/**
 * @brief Update advertising data (stub)
 * @param info N-API callback info
 * @return undefined
 */
Napi::Value UpdateAdvertisingData(const Napi::CallbackInfo &info)
{
  std::cout << "updateAdvertisingData() called" << std::endl;
  // Emit advertisingDataUpdated event
  auto emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
  emit.Call(info.This(), {Napi::String::New(info.Env(), "advertisingDataUpdated"), info[0]});
  // Update manufacturer data
  manufacturerData_ = Napi::Persistent(info[0]);
  // If scanning is active, emit deviceDiscovered with updated data
  if (scanning_)
  {
    Napi::Object device = Napi::Object::New(info.Env());
    device.Set("address", Napi::String::New(info.Env(), "AA:BB:CC:DD:EE:FF"));
    device.Set("name", Napi::String::New(info.Env(), "TestAdvertiser"));
    device.Set("manufacturerData", info[0]);
    emit.Call(info.This(), {Napi::String::New(info.Env(), "deviceDiscovered"), device});
  }
  return info.Env().Undefined();
}

/**
 * @brief Stop BLE advertising (stub)
 * @param info N-API callback info
 * @return undefined
 */
Napi::Value StopAdvertising(const Napi::CallbackInfo &info)
{
  std::cout << "stopAdvertising() called" << std::endl;
  if (!advertising_)
  {
    Napi::Error::New(info.Env(), "Not advertising").ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }
  advertising_ = false;
  manufacturerData_.Reset();
  auto emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
  emit.Call(info.This(), {Napi::String::New(info.Env(), "advertisingStopped")});
  return info.Env().Undefined();
}

/**
 * @brief Start BLE scanning (stub)
 * @param info N-API callback info
 * @return undefined
 */
Napi::Value StartScanning(const Napi::CallbackInfo &info)
{
  std::cout << "startScanning() called" << std::endl;
  if (state_ != State::PoweredOn)
  {
    Napi::Error::New(info.Env(), "Cannot start scanning: adapter not powered on").ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }
  if (scanning_)
  {
    Napi::Error::New(info.Env(), "Already scanning").ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }
  scanning_ = true;
  auto emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
  emit.Call(info.This(), {Napi::String::New(info.Env(), "scanningStarted"), info[0].IsObject() ? info[0] : info.Env().Undefined()});
  // Emit deviceDiscovered event with current manufacturer data if available
  Napi::Object device = Napi::Object::New(info.Env());
  device.Set("address", Napi::String::New(info.Env(), "AA:BB:CC:DD:EE:FF"));
  device.Set("name", Napi::String::New(info.Env(), "TestAdvertiser"));
  if (!manufacturerData_.IsEmpty())
  {
    device.Set("manufacturerData", manufacturerData_.Value());
  }
  else
  {
    uint8_t mdata[4] = {0xFF, 0xFF, 0x01, 0x02};
    device.Set("manufacturerData", Napi::Buffer<uint8_t>::Copy(info.Env(), mdata, 4));
  }
  emit.Call(info.This(), {Napi::String::New(info.Env(), "deviceDiscovered"), device});
  return info.Env().Undefined();
}

/**
 * @brief Stop BLE scanning (stub)
 * @param info N-API callback info
 * @return undefined
 */
Napi::Value StopScanning(const Napi::CallbackInfo &info)
{
  std::cout << "stopScanning() called" << std::endl;
  if (!scanning_)
  {
    Napi::Error::New(info.Env(), "Not scanning").ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }
  scanning_ = false;
  auto emit = info.This().As<Napi::Object>().Get("emit").As<Napi::Function>();
  emit.Call(info.This(), {Napi::String::New(info.Env(), "scanningStopped")});
  return info.Env().Undefined();
}

/**
 * @brief Destroy BLE adapter (stub)
 * @param info N-API callback info
 * @return undefined
 */
Napi::Value Destroy(const Napi::CallbackInfo &info)
{
  std::cout << "destroy() called" << std::endl;
  advertising_ = false;
  scanning_ = false;
  manufacturerData_.Reset();
  listeners_.clear();
  return info.Env().Undefined();
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports)
{
  BLEAdapter::Init(env, exports);
  exports.Set(Napi::String::New(env, "hello"), Napi::Function::New(env, HelloWorld));
  return exports;
}

NODE_API_MODULE(ble_addon, InitAll)
