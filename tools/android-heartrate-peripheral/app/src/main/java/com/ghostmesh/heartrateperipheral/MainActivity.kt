package com.ghostmesh.heartrateperipheral

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
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
    private val TAG = "GMeshHR"

    // Standard Heart Rate Service UUID
    private val HEART_RATE_SERVICE_UUID = UUID.fromString("0000180D-0000-1000-8000-00805f9b34fb")

    @SuppressLint("SetTextI18n")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val statusView = findViewById<TextView>(R.id.status)
        val btn = findViewById<Button>(R.id.btn_toggle)

        if (!ensurePermissions()) {
            statusView.text = "Requesting permissions..."
            return
        }

        btn.setOnClickListener {
            statusView.text = "Advertising with Service Data..."
            startAdvertising()
        }
    }

    private fun ensurePermissions(): Boolean {
        val permissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            arrayOf(Manifest.permission.BLUETOOTH_ADVERTISE, Manifest.permission.BLUETOOTH_CONNECT)
        } else {
            arrayOf(Manifest.permission.ACCESS_FINE_LOCATION)
        }
        val missing = permissions.filter { ActivityCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED }
        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), 1)
            return false
        }
        return true
    }

    private fun startAdvertising() {
        val btAdapter = (getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
        val advertiser = btAdapter.bluetoothLeAdvertiser ?: return

        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(false) // Not connectable
            .build()

        val serviceUuid = ParcelUuid(HEART_RATE_SERVICE_UUID)
        val ghostMeshPacket = createGhostMeshPacket()

        val data = AdvertiseData.Builder()
            .setIncludeDeviceName(false) // To save space
            .addServiceData(serviceUuid, ghostMeshPacket)
            .build()

        val scanResponse = AdvertiseData.Builder()
            .setIncludeDeviceName(true) // Name in scan response
            .build()

        try {
            advertiser.startAdvertising(settings, data, scanResponse, advertiseCallback)
        } catch (e: SecurityException) {
            Log.e(TAG, "startAdvertising permission denied", e)
        }
    }

    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
            Log.i(TAG, "Advertising started")
        }
        override fun onStartFailure(errorCode: Int) {
            Log.e(TAG, "Advertising failed: $errorCode")
        }
    }

    private fun createGhostMeshPacket(): ByteArray {
        val packet = ByteArray(27) // 27 bytes to fit in the advertisement with service data
        // For demonstration, let's fill it with some values.
        // In a real scenario, this would be your actual GhostMesh protocol data.
        for (i in packet.indices) {
            packet[i] = (i % 256).toByte()
        }
        // Example: Set a mock "message type" and "ID"
        packet[0] = 0x01 // Mock message type: TEXT
        packet[1] = 0xAB.toByte() // Mock sender ID
        return packet
    }
}
