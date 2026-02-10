// Stubbed implementation copy (kept for reference / testing)
#include "ble_adapter.h"

// Constructor
BLEAdapter::BLEAdapter(const Napi::CallbackInfo &info)
    : Napi::ObjectWrap<BLEAdapter>(info), state_(State::PoweredOn), advertising_(false), scanning_(false)
{
  if (info.Length() > 0 && info[0].IsObject())
  {
    Napi::Object opts = info[0].As<Napi::Object>();
    if (opts.Has("adapterId") && opts.Get("adapterId").IsString())
    {
      adapterId_ = opts.Get("adapterId").As<Napi::String>().Utf8Value();
    }
  }
  if (adapterId_.empty())
  {
    adapterId_ = std::to_string(reinterpret_cast<uintptr_t>(this));
  }
  adapters_[adapterId_] = this;
}

// Event listener registration
Napi::Value BLEAdapter::On(const Napi::CallbackInfo &info)
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

// Emit event to listeners
Napi::Value BLEAdapter::Emit(const Napi::CallbackInfo &info)
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

// ... remaining methods (identical to platform implementation) ...
