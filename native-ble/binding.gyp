{
  "targets": [
    {
      "target_name": "native_ble",
      "sources": [
        "binding/addon.cc",
        "binding/ble_adapter_wrapper.cc",
        "binding/platform/ble_platform_factory.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "cflags_cc": [ "-std=c++17" ],
      "conditions": [
        ["OS=='mac'", {
          "sources": [
            "binding/platform/macos/ble_platform_macos.mm"
          ],
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LANGUAGE_STANDARD": "c++17",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.15",
            "OTHER_CPLUSPLUSFLAGS": [
              "-std=c++17",
              "-stdlib=libc++"
            ]
          },
          "link_settings": {
            "libraries": [
              "-framework CoreBluetooth",
              "-framework CoreFoundation",
              "-framework Foundation"
            ]
          }
        }],
        ["OS=='win'", {
          "sources": [
            "binding/platform/windows/ble_platform_windows.cpp"
          ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "AdditionalOptions": [
                "/std:c++17",
                "/await"
              ]
            }
          },
          "libraries": [
            "-lruntimeobject.lib"
          ]
        }],
        ["OS=='linux'", {
          "sources": [
            "binding/platform/linux/ble_platform_linux.cpp"
          ],
          "libraries": [
            "<!@(pkg-config --libs gio-2.0)"
          ],
          "include_dirs": [
            "<!@(pkg-config --cflags-only-I gio-2.0 | sed s/-I//g)"
          ],
          "cflags": [
            "<!@(pkg-config --cflags gio-2.0)"
          ]
        }]
      ]
    }
  ]
}
