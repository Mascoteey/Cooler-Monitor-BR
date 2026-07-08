import { motion } from 'framer-motion';
import { MemoryStick, Thermometer, Gauge, Zap } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SensorCard from '../components/ui/SensorCard';
import RealtimeChart from '../components/charts/RealtimeChart';
import { useStore } from '../store/useStore';
import { formatTemp, formatPercent, formatBytes, getUsageColor, getTempColor } from '../utils/formatters';

export default function MemoryPage() {
  const data = useStore((s) => s.hardwareData);
  if (!data) return null;
  const { ram } = data;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Memórias" subtitle={`${ram.name} - ${formatBytes(ram.total)}`} icon={MemoryStick} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SensorCard title="Uso" icon={Gauge} value={formatPercent(ram.usage.current)} valueColor={getUsageColor(ram.usage.current)} gaugeValue={ram.usage.current} percent={ram.usage.current} details={[{ label: 'Usado', value: formatBytes(ram.used) }, { label: 'Disponível', value: formatBytes(ram.total - ram.used) }, { label: 'Total', value: formatBytes(ram.total) }]} />
        <SensorCard title="Temperatura" icon={Thermometer} value={formatTemp(ram.temperature.current)} valueColor={getTempColor(ram.temperature.current)} gaugeValue={ram.temperature.current} gaugeMax={80} gaugeUnit="°C" details={[{ label: 'Mín', value: formatTemp(ram.temperature.min) }, { label: 'Máx', value: formatTemp(ram.temperature.max) }]} />
        <SensorCard title="Frequência" icon={Zap} value={`${ram.frequency} MHz`} gaugeValue={ram.frequency} gaugeMax={8000} gaugeUnit="MHz" details={[{ label: 'Latência', value: `${ram.latency.toFixed(1)} ns` }, { label: 'Canais', value: ram.channels.channel }]} />
        <SensorCard title="Slots" icon={MemoryStick} value={`${ram.slots.length} slots`} details={ram.slots.map((s) => ({ label: `Slot ${s.slot}`, value: `${Math.round(s.size / 1e9)}GB ${s.type} @${s.frequency}MHz` }))} />
      </div>
      <div className="glass-card p-5"><RealtimeChart dataKey="ramUsage" color="#b400ff" label="Uso de RAM" height={250} /></div>
    </motion.div>
  );
}
