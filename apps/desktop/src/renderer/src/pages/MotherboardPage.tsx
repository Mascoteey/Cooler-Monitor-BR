import { motion } from 'framer-motion';
import { CircuitBoard, Thermometer, Cpu } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useStore } from '../store/useStore';
import { formatTemp, getTempColor } from '../utils/formatters';

export default function MotherboardPage() {
  const data = useStore((s) => s.hardwareData);
  if (!data) return null;
  const { motherboard } = data;

  const sensors = [
    { label: 'Chipset', value: motherboard.chipset.temperature, name: motherboard.chipset.name },
    { label: 'VRM', value: motherboard.vrm.temperature },
    { label: 'PCH', value: motherboard.pch.temperature },
    { label: 'Sensor Ambiente', value: motherboard.ambient.temperature },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Placa Mãe" subtitle={motherboard.name} icon={CircuitBoard} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sensors.map((sensor) => (
          <div key={sensor.label} className="glass-card p-5 text-center space-y-3">
            <Thermometer className="w-6 h-6 mx-auto" style={{ color: getTempColor(sensor.value) }} />
            <span className="text-3xl font-bold font-mono" style={{ color: getTempColor(sensor.value) }}>{formatTemp(sensor.value)}</span>
            <span className="block text-xs text-[var(--color-muted)]">{sensor.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
