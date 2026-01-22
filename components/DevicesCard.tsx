import { Device } from '@/lib/types';

interface DevicesCardProps {
  isExpanded: boolean;
  onToggle: () => void;
  devices: Device[];
}

export const DevicesCard = ({ isExpanded, onToggle, devices }: DevicesCardProps) => {
  return (
    <div className="rounded-3xl bg-white/80 dark:bg-zinc-900/50 shadow-lg shadow-black/5 backdrop-blur-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-rounded text-2xl leading-none">devices</span>
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">BLE Devices</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
              {devices.length} devices discovered
            </p>
          </div>
        </div>
        <span
          className={`material-symbols-rounded text-gray-400 transition-transform leading-none ${
            isExpanded ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Device List */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Discovered Devices</h3>
            <div className="divide-y divide-gray-200 dark:divide-zinc-700">
              {devices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                    <span className="material-symbols-rounded text-2xl text-gray-300 dark:text-gray-700 leading-none">
                      devices
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No devices discovered yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
          </div>

          {/* Device Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{devices.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <span className="material-symbols-rounded leading-none">devices</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Connected</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {devices.filter((d) => d.connected).length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-rounded leading-none">lan</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Scanning</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {devices.filter((d) => !d.connected).length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <span className="material-symbols-rounded leading-none">radar</span>
                </div>
              </div>
            </div>
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
