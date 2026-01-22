import { useEffect, useRef } from 'react';

interface PerformanceData {
  timestamp: number;
  bleDeviceCount: number;
}

interface PerMonCardProps {
  isExpanded: boolean;
  onToggle: () => void;
  performanceData: PerformanceData[];
}

export const PerMonCard = ({ isExpanded, onToggle, performanceData }: PerMonCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isExpanded || !canvasRef.current || performanceData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get data bounds
    const maxDevices = Math.max(...performanceData.map(d => d.bleDeviceCount), 10);
    const dataPoints = performanceData.length;
    const maxSeconds = (dataPoints - 1) * 10; // 10 seconds per sample

    // Draw grid
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw vertical grid lines for time intervals
    const maxTimeIntervals = Math.min(Math.floor(maxSeconds / 10) + 1, 12);
    for (let i = 0; i <= maxTimeIntervals; i++) {
      const x = padding + (i / Math.max(dataPoints - 1, 1)) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw Y-axis labels (device count)
    ctx.fillStyle = 'rgba(156, 163, 175, 0.8)';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxDevices / 5) * (5 - i));
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(value.toString(), padding - 10, y);
    }

    // Draw line chart
    if (performanceData.length > 0) {
      // Create gradient
      const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
      gradient.addColorStop(1, 'rgba(20, 184, 166, 0.8)');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      performanceData.forEach((data, index) => {
        // X position: evenly spaced at 10-second intervals (0s, 10s, 20s, 30s...)
        const x = padding + (index / Math.max(dataPoints - 1, 1)) * chartWidth;
        // Y position: scaled by device count
        const y = height - padding - (data.bleDeviceCount / maxDevices) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw area under curve
      const lastIndex = performanceData.length - 1;
      const lastX = padding + (lastIndex / Math.max(dataPoints - 1, 1)) * chartWidth;
      ctx.lineTo(lastX, height - padding);
      ctx.lineTo(padding, height - padding);
      ctx.closePath();

      const areaGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
      areaGradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
      areaGradient.addColorStop(1, 'rgba(20, 184, 166, 0.05)');
      ctx.fillStyle = areaGradient;
      ctx.fill();

      // Draw data points
      ctx.fillStyle = 'rgba(16, 185, 129, 1)';
      performanceData.forEach((data, index) => {
        const x = padding + (index / Math.max(dataPoints - 1, 1)) * chartWidth;
        const y = height - padding - (data.bleDeviceCount / maxDevices) * chartHeight;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // White outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
  }, [isExpanded, performanceData]);

  // Calculate statistics
  const bleDeviceCounts = performanceData.map(d => d.bleDeviceCount);
  const currentCount = bleDeviceCounts[bleDeviceCounts.length - 1] || 0;
  const avgCount = bleDeviceCounts.length > 0
    ? Math.round(bleDeviceCounts.reduce((a, b) => a + b, 0) / bleDeviceCounts.length)
    : 0;
  const maxCount = Math.max(...bleDeviceCounts, 0);
  const minCount = Math.min(...bleDeviceCounts, 0);

  return (
    <div className="rounded-3xl bg-white/80 dark:bg-zinc-900/50 shadow-lg shadow-black/5 backdrop-blur-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-rounded text-2xl leading-none">monitoring</span>
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Performance Monitor</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
              {currentCount} BLE devices • {performanceData.length} samples
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
          {/* Stats Row */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{currentCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-rounded leading-none">sensors</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Average</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{avgCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <span className="material-symbols-rounded leading-none">speed</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Peak</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{maxCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <span className="material-symbols-rounded leading-none">trending_up</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Minimum</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{minCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <span className="material-symbols-rounded leading-none">trending_down</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">BLE Devices Over Time</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Active Devices</span>
              </div>
            </div>

            {performanceData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <span className="material-symbols-rounded text-2xl text-gray-300 dark:text-gray-700 leading-none">
                    show_chart
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">No performance data yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Data will appear here once BLE scanning starts</p>
              </div>
            ) : (
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="w-full h-[300px] rounded-xl"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-rounded text-lg leading-none">info</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Performance Monitoring</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Tracking BLE device count every 10 seconds. This shows nearby Bluetooth Low Energy devices
                  discovered during scanning. Peak activity indicates high device density in the area.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
