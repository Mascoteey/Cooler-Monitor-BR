export function formatTemp(celsius: number): string {
  return `${celsius.toFixed(1)}°C`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatClock(mhz: number): string {
  if (mhz >= 1000) return `${(mhz / 1000).toFixed(2)} GHz`;
  return `${mhz.toFixed(0)} MHz`;
}

export function formatPower(watts: number): string {
  return `${watts.toFixed(0)} W`;
}

export function formatVoltage(v: number): string {
  return `${v.toFixed(3)} V`;
}

export function formatBytes(bytes: number): string {
  const KB = 1024, MB = KB * 1024, GB = MB * 1024, TB = GB * 1024;
  if (bytes >= TB) return `${(bytes / TB).toFixed(2)} TB`;
  if (bytes >= GB) return `${(bytes / GB).toFixed(1)} GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(0)} MB`;
  if (bytes >= KB) return `${(bytes / KB).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function formatSpeed(bytesPerSec: number): string {
  const KB = 1024, MB = KB * 1024, GB = MB * 1024;
  if (bytesPerSec >= GB) return `${(bytesPerSec / GB).toFixed(2)} GB/s`;
  if (bytesPerSec >= MB) return `${(bytesPerSec / MB).toFixed(1)} MB/s`;
  if (bytesPerSec >= KB) return `${(bytesPerSec / KB).toFixed(0)} KB/s`;
  return `${bytesPerSec} B/s`;
}

export function formatRpm(rpm: number): string {
  return `${rpm.toFixed(0)} RPM`;
}

export function formatLatency(ns: number): string {
  return `${ns.toFixed(1)} ns`;
}

export function formatPing(ms: number): string {
  return `${ms.toFixed(0)} ms`;
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

export function formatHealth(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getStatusColor(value: number, thresholds: { warning: number; critical: number }): string {
  if (value >= thresholds.critical) return '#ff0044';
  if (value >= thresholds.warning) return '#ff6600';
  return '#00ff88';
}

export function getTempColor(temp: number): string {
  return getStatusColor(temp, { warning: 70, critical: 85 });
}

export function getUsageColor(usage: number): string {
  return getStatusColor(usage, { warning: 70, critical: 90 });
}
