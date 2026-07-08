import { motion } from 'framer-motion';
import { Monitor, Thermometer, Zap, Gauge, Activity, HardDrive, Fan } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SensorCard from '../components/ui/SensorCard';
import RealtimeChart from '../components/charts/RealtimeChart';
import { useStore } from '../store/useStore';
import { formatTemp, formatPercent, formatClock, formatPower, getTempColor, getUsageColor } from '../utils/formatters';

export default function GpuPage() {
  const data = useStore((s) => s.hardwareData);
  if (!data) return null;
  const { gpu } = data;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="GPU" subtitle={gpu.name} icon={Monitor} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <SensorCard title="Temperatura" icon={Thermometer} value={formatTemp(gpu.temperature.current)} valueColor={getTempColor(gpu.temperature.current)} gaugeValue={gpu.temperature.current} gaugeMax={100} gaugeUnit="°C" details={[{ label: 'Mín', value: formatTemp(gpu.temperature.min) }, { label: 'Máx', value: formatTemp(gpu.temperature.max), color: getTempColor(gpu.temperature.max) }, { label: 'Hotspot', value: formatTemp(gpu.hotspot.current), color: getTempColor(gpu.hotspot.current) }]} />
        <SensorCard title="Uso" icon={Activity} value={formatPercent(gpu.usage.current)} valueColor={getUsageColor(gpu.usage.current)} gaugeValue={gpu.usage.current} percent={gpu.usage.current} details={[{ label: 'Clock', value: formatClock(gpu.clock.current) }, { label: 'Memória', value: formatClock(gpu.memoryClock.current) }, { label: 'VRAM', value: formatPercent(gpu.vram.usagePercent) }]} />
        <SensorCard title="Memória" icon={HardDrive} value={`${Math.round(gpu.vram.used / 1e6)}MB`} gaugeValue={gpu.vram.usagePercent} details={[{ label: 'Usado', value: `${Math.round(gpu.vram.used / 1e6)}MB` }, { label: 'Total', value: `${Math.round(gpu.vram.total / 1e6)}MB` }, { label: 'Interface', value: gpu.pcie.speed }]} />
        <SensorCard title="Consumo" icon={Zap} value={formatPower(gpu.power.current)} gaugeValue={gpu.power.current} gaugeMax={450} gaugeUnit="W" details={[{ label: 'Voltagem', value: `${gpu.voltage.current.toFixed(3)}V` }, { label: 'Fan', value: `${gpu.fan.current.toFixed(0)} RPM` }, { label: 'Mín', value: formatPower(gpu.power.min) }, { label: 'Máx', value: formatPower(gpu.power.max) }]} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5"><RealtimeChart dataKey="gpuTemp" color="var(--color-secondary)" label="Temperatura GPU" height={250} /></div>
        <div className="glass-card p-5"><RealtimeChart dataKey="gpuUsage" color="#b400ff" label="Uso GPU" height={250} /></div>
      </div>
    </motion.div>
  );
}
