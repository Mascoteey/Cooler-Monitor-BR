import { motion } from 'framer-motion';
import { HardDrive, Thermometer, Activity, Zap } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SensorCard from '../components/ui/SensorCard';
import { useStore } from '../store/useStore';
import { formatTemp, formatPercent, formatBytes, getTempColor, getUsageColor } from '../utils/formatters';

export default function StoragePage() {
  const data = useStore((s) => s.hardwareData);
  if (!data) return null;
  const { storage } = data;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Discos" subtitle={`${storage.length} dispositivo(s)`} icon={HardDrive} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {storage.map((disk, i) => (
          <div key={i} className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center"><HardDrive className="w-5 h-5 text-cyan-400" /></div>
              <div><h3 className="text-sm font-semibold">{disk.name}</h3><p className="text-xs text-[var(--color-muted)]">{disk.type} • {formatBytes(disk.total)}</p></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><span className="text-xs text-[var(--color-muted)]">Temperatura</span><p className="text-sm font-mono font-bold" style={{ color: getTempColor(disk.temperature.current) }}>{formatTemp(disk.temperature.current)}</p></div>
              <div><span className="text-xs text-[var(--color-muted)]">Saúde</span><p className="text-sm font-mono font-bold text-green-400">{disk.health}%</p></div>
              <div><span className="text-xs text-[var(--color-muted)]">Vida Útil</span><p className="text-sm font-mono font-bold">{disk.lifeUsed.toFixed(1)}%</p></div>
              <div><span className="text-xs text-[var(--color-muted)]">Uso</span><p className="text-sm font-mono font-bold" style={{ color: getUsageColor(disk.usagePercent) }}>{formatPercent(disk.usagePercent)}</p></div>
              <div><span className="text-xs text-[var(--color-muted)]">Leitura</span><p className="text-sm font-mono font-bold">{disk.readSpeed} MB/s</p></div>
              <div><span className="text-xs text-[var(--color-muted)]">Escrita</span><p className="text-sm font-mono font-bold">{disk.writeSpeed} MB/s</p></div>
              <div><span className="text-xs text-[var(--color-muted)]">Total Lido</span><p className="text-sm font-mono font-bold">{formatBytes(disk.readBytes)}</p></div>
              <div><span className="text-xs text-[var(--color-muted)]">Total Escrito</span><p className="text-sm font-mono font-bold">{formatBytes(disk.writeBytes)}</p></div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
