import { motion } from 'framer-motion';
import { Activity, Cpu, Monitor, MemoryStick, HardDrive, CircuitBoard, Network, Fan, Zap, Usb } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useStore } from '../store/useStore';

const categoryIcons: Record<string, typeof Cpu> = {
  CPU: Cpu, GPU: Monitor, RAM: MemoryStick, Motherboard: CircuitBoard,
  Storage: HardDrive, Network: Network, Fans: Fan, Power: Zap, USB: Usb,
};

export default function SensorsPage() {
  const data = useStore((s) => s.hardwareData);
  if (!data) return null;

  const grouped = data.sensors.reduce(
    (acc, sensor) => {
      if (!acc[sensor.category]) acc[sensor.category] = [];
      acc[sensor.category].push(sensor);
      return acc;
    },
    {} as Record<string, typeof data.sensors>,
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Todos os Sensores" subtitle={`${data.sensors.length} sensores encontrados`} icon={Activity} />
      {Object.entries(grouped).map(([category, sensors]) => {
        const Icon = categoryIcons[category] || Activity;
        return (
          <div key={category} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-4 h-4 text-[var(--color-primary)]" />
              <h3 className="text-sm font-semibold">{category}</h3>
              <span className="text-xs text-[var(--color-muted)] ml-auto">{sensors.length} sensores</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {sensors.map((sensor, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                  <span className="text-xs text-[var(--color-text)] truncate max-w-[160px]">{sensor.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold" style={{
                      color: sensor.status === 'critical' ? '#ff0044' : sensor.status === 'warning' ? '#ff6600' : 'var(--color-primary)',
                    }}>
                      {sensor.value.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-[var(--color-muted)]">{sensor.unit}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${sensor.status === 'critical' ? 'bg-red-500' : sensor.status === 'warning' ? 'bg-orange-500' : 'bg-green-500'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
