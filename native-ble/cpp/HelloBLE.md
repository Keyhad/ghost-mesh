# Hello BLE Native Addon: Build & Usage Guide

This document explains how to build and test a simple Node.js native addon using C++ and N-API (node-addon-api) on macOS (x64), named "Hello BLE".

## Overview

- The addon exposes a single function, `hello()`, which returns the string "Hello, BLE Native!" to Node.js.
- This serves as a minimal working example to verify your native build toolchain and Node.js integration before implementing real BLE logic.

## Directory Structure

```plain
native-ble/
  cpp/
    hello.cc         # C++ source for the addon
    binding.gyp      # node-gyp build configuration
    hello.js         # Node.js test loader for the addon
    build/           # (created by node-gyp)
      Release/
        ble_addon.node  # Compiled native addon
```

## Prerequisites

- macOS (x64)
- Xcode Command Line Tools (v15 or later)
- Node.js (v16+ recommended)
- npm (v8+ recommended)

## Setup Steps

1. **Install node-addon-api**

   ```sh
   npm install node-addon-api
   ```

2. **C++ Source: hello.cc**

   ```cpp
   #include <napi.h>

   Napi::String HelloWorld(const Napi::CallbackInfo& info) {
     Napi::Env env = info.Env();
     return Napi::String::New(env, "Hello, BLE Native!");
   }

   Napi::Object Init(Napi::Env env, Napi::Object exports) {
     exports.Set(Napi::String::New(env, "hello"), Napi::Function::New(env, HelloWorld));
     return exports;
   }

   NODE_API_MODULE(ble_addon, Init)
   ```

3. **Build Config: binding.gyp**

   ```json
   {
     "targets": [
       {
         "target_name": "ble_addon",
         "sources": [ "hello.cc" ],
         "cflags!": [ "-fno-exceptions" ],
         "cflags_cc!": [ "-fno-exceptions" ],
         "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
         "include_dirs": [
           "<!(node -p \"require('node-addon-api').include\")",
           "<!(node -p \"require('node-addon-api').include_dir || require('node-addon-api').include\")",
           "../../node_modules/node-addon-api"
         ],
         "dependencies": [ "<!(node -p \"require('node-addon-api').gyp\")" ],
         "libraries": []
       }
     ]
   }
   ```

4. **Build the Addon**

   ```sh
   npx node-gyp clean configure build --directory native-ble/cpp
   ```

   - Output: `native-ble/cpp/build/Release/ble_addon.node`

5. **Test Loader: hello.js**

   ```js
   const path = require('path');
   const addon = require(path.join(__dirname, './build/Release/ble_addon.node'));
   console.log(addon.hello());
   ```

6. **Run the Test**

   ```sh
   node native-ble/cpp/hello.js
   ```

   - Output should be: `Hello, BLE Native!`

## Cross-Platform Notes

- The binding.gyp is configured to support node-addon-api on different platforms (macOS, Linux, Windows).
- For other platforms, ensure you have the correct build tools (e.g., Visual Studio for Windows).
- The include_dirs section in binding.gyp is robust for most environments, but you may need to adjust paths if your setup is non-standard.

## Next Steps

- Use this working setup as a foundation for implementing real BLE functionality in C++.
- Expand the C++ code to expose BLE operations (advertising, scanning, etc.) to Node.js.
- Update the Node.js loader and integration tests to use the new native BLE features.

---

This process ensures your native build toolchain is working and ready for further BLE development.
