import { useEffect, useRef } from 'react';
import { CardHeader } from './CardHeader';
import { StatCard } from './StatCard';

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
    <div className="card-container bg-cyan-50/80 dark:bg-cyan-950/20 shadow-cyan-500/5">
      <CardHeader
        icon="monitoring"
        title="Performance Monitor"
        subtitle={`${currentCount} BLE devices • ${performanceData.length} samples`}
        gradientFrom="from-emerald-500"
        gradientTo="to-teal-600"
        isExpanded={isExpanded}
        onToggle={onToggle}
      />

      {isExpanded && (
        <div className="card-content">
          {/* Stats Row */}
          <div className="card-grid card-grid-4">
            <StatCard
              label="Current"
              value={currentCount}
              icon="sensors"
              colorScheme="emerald"
            />
            <StatCard
              label="Average"
              value={avgCount}
              icon="speed"
              colorScheme="blue"
            />
            <StatCard
              label="Peak"
              value={maxCount}
              icon="trending_up"
              colorScheme="purple"
            />
            <StatCard
              label="Minimum"
              value={minCount}
              icon="trending_down"
              colorScheme="red"
            />
          </div>

          {/* Chart */}
          <div className="card-section">
            <div className="section-header">
              <h3 className="section-heading">BLE Devices Over Time</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Active Devices</span>
              </div>
            </div>

            {performanceData.length === 0 ? (
              <div className="empty-state">
                <span className="material-symbols-rounded empty-state-icon">
                  show_chart
                </span>
                <p className="empty-state-text">No performance data yet</p>
                <p className="empty-state-subtext">Data will appear here once BLE scanning starts</p>
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
