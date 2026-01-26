
/**
 * @file hello.cc
 * @brief Contains HelloWorld function for BLE native addon.
 */

#include <napi.h>

/**
 * @brief Returns a hello string from native BLE addon
 * @param info N-API callback info
 * @return "Hello, BLE Native!"
 */
Napi::String HelloWorld(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  return Napi::String::New(env, "Hello, BLE Native!");
}

// No NODE_API_MODULE here; registration is done in ble_adapter.cc
