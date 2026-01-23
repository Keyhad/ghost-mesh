import { useEffect, useRef } from 'react';
import { Device } from '@/lib/types';
import { CardHeader } from './CardHeader';

interface SignalHistogramCardProps {
  isExpanded: boolean;
  onToggle: () => void;
  devices: Device[];
}

export const SignalHistogramCard = ({ isExpanded, onToggle, devices }: SignalHistogramCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isExpanded || !canvasRef.current) return;

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
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Filter active devices with RSSI data
    const activeDevices = devices.filter(d => d.connected && d.rssi !== undefined);

    if (activeDevices.length === 0) {
      // Show empty state
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('No active devices with signal data', width / 2, height / 2);
      return;
    }

    // Define RSSI buckets (signal strength ranges)
    // BLE RSSI typically ranges from -100 (weakest) to -30 (strongest)
    const buckets = [
      { label: 'Excellent\n-30 to -50', min: -50, max: -30, count: 0, color: '#10b981' },
      { label: 'Good\n-50 to -60', min: -60, max: -50, count: 0, color: '#3b82f6' },
      { label: 'Fair\n-60 to -70', min: -70, max: -60, count: 0, color: '#f59e0b' },
      { label: 'Weak\n-70 to -80', min: -80, max: -70, count: 0, color: '#ef4444' },
      { label: 'Very Weak\n< -80', min: -100, max: -80, count: 0, color: '#991b1b' },
    ];

    // Count devices in each bucket
    activeDevices.forEach(device => {
      const rssi = device.rssi!;
      for (const bucket of buckets) {
        if (rssi > bucket.min && rssi <= bucket.max) {
          bucket.count++;
          break;
        }
      }
    });

    // Find max count for scaling
    const maxCount = Math.max(...buckets.map(b => b.count), 1);

    // Draw bars
    const barWidth = chartWidth / buckets.length;
    const barSpacing = 10;
    const actualBarWidth = barWidth - barSpacing;

    buckets.forEach((bucket, i) => {
      const barHeight = (bucket.count / maxCount) * chartHeight;
      const x = padding + i * barWidth + barSpacing / 2;
      const y = padding + chartHeight - barHeight;

      // Draw bar with gradient
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, bucket.color);
      gradient.addColorStop(1, bucket.color + '80');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, actualBarWidth, barHeight);

      // Draw bar outline
      ctx.strokeStyle = bucket.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, actualBarWidth, barHeight);

      // Draw count on top of bar
      if (bucket.count > 0) {
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 16px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(bucket.count.toString(), x + actualBarWidth / 2, y - 5);
      }

      // Draw label below bar
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'center';
      const labelLines = bucket.label.split('\n');
      labelLines.forEach((line, lineIndex) => {
        ctx.fillText(
          line,
          x + actualBarWidth / 2,
          padding + chartHeight + 15 + lineIndex * 12
        );
      });
    });

    // Draw Y-axis
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.stroke();

    // Draw X-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();

    // Draw Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padding + chartHeight - (chartHeight / 5) * i;
      const value = Math.round((maxCount / 5) * i);
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }

    // Calculate and draw median RSSI line (all devices)
    const rssiValues = activeDevices.map(d => d.rssi!).sort((a, b) => b - a); // Sort descending (stronger first)
    const medianRssi = rssiValues.length > 0
      ? rssiValues.length % 2 === 0
        ? (rssiValues[rssiValues.length / 2 - 1] + rssiValues[rssiValues.length / 2]) / 2
        : rssiValues[Math.floor(rssiValues.length / 2)]
      : 0;

    // Calculate filtered median excluding weakest bucket (< -80 dBm)
    const strongRssiValues = rssiValues.filter(rssi => rssi > -80);
    const filteredMedianRssi = strongRssiValues.length > 0
      ? strongRssiValues.length % 2 === 0
        ? (strongRssiValues[strongRssiValues.length / 2 - 1] + strongRssiValues[strongRssiValues.length / 2]) / 2
        : strongRssiValues[Math.floor(strongRssiValues.length / 2)]
      : 0;

    // Determine which bucket the median falls into for visual reference
    let medianQuality = 'Fair';
    let medianColor = '#f59e0b';
    if (medianRssi > -50) {
      medianQuality = 'Excellent';
      medianColor = '#10b981';
    } else if (medianRssi > -60) {
      medianQuality = 'Good';
      medianColor = '#3b82f6';
    } else if (medianRssi > -70) {
      medianQuality = 'Fair';
      medianColor = '#f59e0b';
    } else if (medianRssi > -80) {
      medianQuality = 'Weak';
      medianColor = '#ef4444';
    } else {
      medianQuality = 'Very Weak';
      medianColor = '#991b1b';
    }

    // Determine filtered median quality
    let filteredMedianQuality = 'Fair';
    let filteredMedianColor = '#f59e0b';
    if (filteredMedianRssi > -50) {
      filteredMedianQuality = 'Excellent';
      filteredMedianColor = '#10b981';
    } else if (filteredMedianRssi > -60) {
      filteredMedianQuality = 'Good';
      filteredMedianColor = '#3b82f6';
    } else if (filteredMedianRssi > -70) {
      filteredMedianQuality = 'Fair';
      filteredMedianColor = '#f59e0b';
    } else if (filteredMedianRssi > -80) {
      filteredMedianQuality = 'Weak';
      filteredMedianColor = '#ef4444';
    }

    // Find which bucket contains the medians
    let medianBucketIndex = -1;
    let filteredMedianBucketIndex = -1;
    for (let i = 0; i < buckets.length; i++) {
      if (medianRssi > buckets[i].min && medianRssi <= buckets[i].max) {
        medianBucketIndex = i;
      }
      if (filteredMedianRssi > buckets[i].min && filteredMedianRssi <= buckets[i].max) {
        filteredMedianBucketIndex = i;
      }
    }

    // Draw filtered median line (excluding weakest) if we have devices
    if (filteredMedianBucketIndex >= 0 && strongRssiValues.length > 0) {
      // Draw dashed line across the chart
      ctx.setLineDash([12, 6]);
      ctx.strokeStyle = filteredMedianColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;

      const medianY = padding + chartHeight * 0.2; // Position higher

      ctx.beginPath();
      ctx.moveTo(padding, medianY);
      ctx.lineTo(padding + chartWidth, medianY);
      ctx.stroke();

      ctx.globalAlpha = 1.0;
      ctx.setLineDash([]);

      // Draw median label with background
      const labelText = `Median (Good+): ${Math.round(filteredMedianRssi)} dBm (${filteredMedianQuality})`;
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'left';
      const textWidth = ctx.measureText(labelText).width;

      // Background for label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(padding + chartWidth - textWidth - 16, medianY - 18, textWidth + 12, 20);

      // Border for label
      ctx.strokeStyle = filteredMedianColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(padding + chartWidth - textWidth - 16, medianY - 18, textWidth + 12, 20);

      // Label text
      ctx.fillStyle = filteredMedianColor;
      ctx.fillText(labelText, padding + chartWidth - textWidth - 10, medianY - 4);
    }

    // Draw median line (all devices) if we have devices
    if (medianBucketIndex >= 0 && activeDevices.length > 0) {
      // Draw dashed line across the chart
      ctx.setLineDash([8, 4]);
      ctx.strokeStyle = medianColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;

      const medianY = padding + chartHeight * 0.4; // Position lower

      ctx.beginPath();
      ctx.moveTo(padding, medianY);
      ctx.lineTo(padding + chartWidth, medianY);
      ctx.stroke();

      ctx.globalAlpha = 1.0;
      ctx.setLineDash([]);

      // Draw median label with background
      const labelText = `Median (All): ${Math.round(medianRssi)} dBm (${medianQuality})`;
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'left';
      const textWidth = ctx.measureText(labelText).width;

      // Background for label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(padding + chartWidth - textWidth - 16, medianY - 18, textWidth + 12, 20);

      // Border for label
      ctx.strokeStyle = medianColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(padding + chartWidth - textWidth - 16, medianY - 18, textWidth + 12, 20);

      // Label text
      ctx.fillStyle = medianColor;
      ctx.fillText(labelText, padding + chartWidth - textWidth - 10, medianY - 4);
    }

    // Draw title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('Devices by Signal Strength', padding, padding - 20);

  }, [isExpanded, devices]);

  // Calculate statistics only when expanded to save power
  const activeDevices = devices.filter(d => d.connected && d.rssi !== undefined);
  const averageRssi = isExpanded && activeDevices.length > 0
    ? Math.round(activeDevices.reduce((sum, d) => sum + (d.rssi || 0), 0) / activeDevices.length)
    : 0;
  const strongestSignal = isExpanded && activeDevices.length > 0
    ? Math.max(...activeDevices.map(d => d.rssi || -100))
    : 0;
  const weakestSignal = isExpanded && activeDevices.length > 0
    ? Math.min(...activeDevices.map(d => d.rssi || -100))
    : 0;

  // Calculate median only when expanded
  const rssiValues = isExpanded ? activeDevices.map(d => d.rssi!).sort((a, b) => b - a) : [];
  const medianRssi = isExpanded && rssiValues.length > 0
    ? rssiValues.length % 2 === 0
      ? Math.round((rssiValues[rssiValues.length / 2 - 1] + rssiValues[rssiValues.length / 2]) / 2)
      : Math.round(rssiValues[Math.floor(rssiValues.length / 2)])
    : 0;

  return (
    <div className="rounded-3xl bg-white/80 dark:bg-zinc-900/50 shadow-lg shadow-black/5 backdrop-blur-xl overflow-hidden">
      <CardHeader
        icon="signal_cellular_alt"
        title="Signal Strength"
        subtitle={`${activeDevices.length} active devices`}
        gradientFrom="from-violet-500"
        gradientTo="to-purple-600"
        isExpanded={isExpanded}
        onToggle={onToggle}
      />

      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Histogram Canvas */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
            <canvas
              ref={canvasRef}
              className="w-full"
              style={{ height: '320px' }}
            />
          </div>

          {/* Signal Statistics */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Median RSSI</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{medianRssi} dBm</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <span className="material-symbols-rounded leading-none">show_chart</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Average RSSI</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{averageRssi} dBm</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-rounded leading-none">graphic_eq</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Strongest</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{strongestSignal} dBm</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <span className="material-symbols-rounded leading-none">signal_cellular_alt</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Weakest</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{weakestSignal} dBm</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <span className="material-symbols-rounded leading-none">signal_cellular_0_bar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signal Legend */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-zinc-800/50">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Signal Strength Guide</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-emerald-500"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Excellent (-30 to -50 dBm) - Very close, strong signal</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Good (-50 to -60 dBm) - Close proximity, good connection</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-amber-500"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Fair (-60 to -70 dBm) - Medium distance, acceptable</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Weak (-70 to -80 dBm) - Far away, unstable</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-red-900"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Very Weak (&lt; -80 dBm) - At edge of range</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
