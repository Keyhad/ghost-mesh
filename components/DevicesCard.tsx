import { useState } from 'react';
import { Device } from '@/lib/types';
import { CardHeader } from './CardHeader';
import { StatCard } from './StatCard';

interface DevicesCardProps {
  isExpanded: boolean;
  onToggle: () => void;
  devices: Device[];
}

export const DevicesCard = ({ isExpanded, onToggle, devices }: DevicesCardProps) => {
  const [showDeviceList, setShowDeviceList] = useState(true);

  return (
    <div className="card-container bg-indigo-50/80 dark:bg-indigo-950/20 shadow-indigo-500/5">
      <CardHeader
        icon="devices"
        title="BLE Devices"
        subtitle={`${devices.length} devices discovered`}
        gradientFrom="from-orange-500"
        gradientTo="to-amber-600"
        isExpanded={isExpanded}
        onToggle={onToggle}
      />

      {isExpanded && (
        <div className="card-content">
          {/* Device List */}
          <div className="card-section">
            <button
              onClick={() => setShowDeviceList(!showDeviceList)}
              className="section-header w-full hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg p-2 -m-2 transition-colors"
            >
              <h3 className="section-heading">Discovered Devices</h3>
              <span className="material-symbols-rounded text-gray-400 transition-transform" style={{ transform: showDeviceList ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </button>

            {showDeviceList && (
              <div className="divide-y divide-gray-200 dark:divide-zinc-700 mt-4">
                {devices.length === 0 ? (
                  <div className="empty-state">
                    <span className="material-symbols-rounded empty-state-icon">
                      devices
                    </span>
                    <p className="empty-state-text">No devices discovered yet</p>
                    <p className="empty-state-subtext">
                      Start BLE scanning to discover nearby devices
                    </p>
                  </div>
                ) : (
                  devices.map((device) => (
                    <div
                      key={device.id}
                      className="py-4 first:pt-0 last:pb-0 hover:bg-gray-50/50 dark:hover:bg-zinc-700/30 transition px-2 -mx-2 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                            {/* <span className="material-symbols-rounded text-lg leading-none">bluetooth</span> */}
                          </div>
                          <div>
                            <p className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                              id: {device.id}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              pid: {device.peerId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {device.connected && (
                            <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                              Connected
                            </span>
                          )}
                          <div className="text-right">
                            <p className="text-xs text-gray-400 dark:text-gray-500">Last seen</p>
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                              {new Date(device.lastSeen).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Device Stats */}
          <div className="card-grid card-grid-3">
            <StatCard
              label="Total"
              value={devices.length}
              icon="devices"
              colorScheme="emerald"
            />
            <StatCard
              label="Connected"
              value={devices.filter((d) => d.connected).length}
              icon="lan"
              colorScheme="blue"
            />
            <StatCard
              label="Scanning"
              value={devices.filter((d) => !d.connected).length}
              icon="radar"
              colorScheme="purple"
            />
          </div>

          {/* Info */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-rounded text-lg leading-none">info</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">BLE Device Discovery</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  This list shows all Bluetooth Low Energy devices discovered nearby during scanning.
                  Devices include smartphones, wearables, IoT devices, and other BLE-enabled hardware.
                  Connected devices are part of the GhostMesh network.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
