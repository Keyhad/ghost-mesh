package com.ghostmesh.peripheraltest

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.ParcelUuid
import android.util.Log
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import java.util.UUID

class MainActivity : AppCompatActivity() {
    private val TAG = "GMeshPerf"
    private var bluetoothAdapter: BluetoothAdapter? = null
    private var advertiser: BluetoothLeAdvertiser? = null
    private var advertiseCallback: AdvertiseCallback? = null
    private val handler = Handler(Looper.getMainLooper())

    // Using a common Service UUID for visibility (e.g., Heart Rate Service)
    private val SERVICE_UUID = UUID.fromString("0000180D-0000-1000-8000-00805f9b34fb")

    @SuppressLint("SetTextI18n")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val statusView = findViewById<TextView>(R.id.status)
        val btn = findViewById<Button>(R.id.btn_toggle)

        val btManager = getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        bluetoothAdapter = btManager.adapter

        val hasLe = packageManager.hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE)
        val multiAdv = bluetoothAdapter?.isMultipleAdvertisementSupported ?: false

        statusView.text = "BLE LE: $hasLe\nAdapter: ${bluetoothAdapter != null}\nMulti-advert supported: $multiAdv"

        btn.setOnClickListener {
            if (advertiseCallback == null) {
                startAdvertising(statusView)
            } else {
                stopAdvertising(statusView)
            }
        }
    }

    private fun ensurePermissions(): Boolean {
        val permissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            arrayOf(
                Manifest.permission.BLUETOOTH_ADVERTISE,
                Manifest.permission.BLUETOOTH_CONNECT
            )
        } else {
            arrayOf(Manifest.permission.ACCESS_FINE_LOCATION)
        }

        val missing = permissions.filter {
            ActivityCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), 1)
            return false
        }
        return true
    }

    private fun startAdvertising(statusView: TextView) {
        if (!ensurePermissions()) {
            statusView.text = statusView.text.toString() + "\nRequesting permissions..."
            return
        }

        val adapter = bluetoothAdapter
        if (adapter == null || !adapter.isEnabled) {
            statusView.text = statusView.text.toString() + "\nBluetooth is disabled or not available"
            return
        }

        advertiser = adapter.bluetoothLeAdvertiser
        val adv = advertiser
        if (adv == null) {
            statusView.text = statusView.text.toString() + "\nAdvertiser not supported on this device"
            return
        }

        // Set device name
        try {
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                adapter.name = "GhostMesh"
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Permission denied to set name", e)
        }

        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(true)
            .build()

        val data = AdvertiseData.Builder()
            .setIncludeDeviceName(false) // Moved name to Scan Response to save space
            .addServiceUuid(ParcelUuid(SERVICE_UUID))
            .build()

        val scanResponse = AdvertiseData.Builder()
            .setIncludeDeviceName(true)
            .build()

        advertiseCallback = object : AdvertiseCallback() {
            override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
                Log.i(TAG, "Advertising started successfully")
                runOnUiThread {
                    statusView.text = statusView.text.toString() + "\nAdvertising as 'GhostMesh' (UUID: 180D)"
                }
            }

            override fun onStartFailure(errorCode: Int) {
                Log.e(TAG, "Advertising failed with error: $errorCode")
                runOnUiThread {
                    statusView.text = statusView.text.toString() + "\nAdvertising failed: $errorCode"
                }
                advertiseCallback = null
            }
        }

        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_ADVERTISE) == PackageManager.PERMISSION_GRANTED || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            adv.startAdvertising(settings, data, scanResponse, advertiseCallback)
        }
    }

    private fun stopAdvertising(statusView: TextView) {
        val adv = advertiser
        val cb = advertiseCallback
        if (adv != null && cb != null) {
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_ADVERTISE) == PackageManager.PERMISSION_GRANTED || Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                adv.stopAdvertising(cb)
                statusView.text = statusView.text.toString() + "\nAdvertising stopped"
            }
        }
        advertiseCallback = null
    }
}
