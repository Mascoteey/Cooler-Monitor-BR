import { motion } from 'framer-motion';
import { Cpu, Thermometer, Zap, Gauge, Activity, Hash } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import SensorCard from '../components/ui/SensorCard';
import RealtimeChart from '../components/charts/RealtimeChart';
import { useStore } from '../store/useStore';
import { formatTemp, formatPercent, formatClock, formatPower, getTempColor, getUsageColor } from '../utils/formatters';

export default function CpuPage() {
  const data = useStore((s) => s.hardwareData);

  if (!data) return null;
  const { cpu } = data;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="CPU" subtitle={cpu.name} icon={Cpu} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <SensorCard title="Temperatura" icon={Thermometer} value={formatTemp(cpu.temperature.current)} valueColor={getTempColor(cpu.temperature.current)} gaugeValue={cpu.temperature.current} gaugeMax={100} gaugeUnit="°C" details={[{ label: 'Mín', value: formatTemp(cpu.temperature.min) }, { label: 'Máx', value: formatTemp(cpu.temperature.max), color: getTempColor(cpu.temperature.max) }, { label: 'Média', value: formatTemp(cpu.temperature.avg) }]} />
        <SensorCard title="Uso" icon={Activity} value={formatPercent(cpu.usage.current)} valueColor={getUsageColor(cpu.usage.current)} gaugeValue={cpu.usage.current} percent={cpu.usage.current} details={[{ label: 'Mín', value: formatPercent(cpu.usage.min) }, { label: 'Máx', value: formatPercent(cpu.usage.max) }, { label: 'Média', value: formatPercent(cpu.usage.avg) }]} />
        <SensorCard title="Clock" icon={Gauge} value={formatClock(cpu.clock.current)} gaugeValue={cpu.clock.current} gaugeMax={6000} gaugeUnit="MHz" details={[{ label: 'Mín', value: formatClock(cpu.clock.min) }, { label: 'Máx', value: formatClock(cpu.clock.max) }, { label: 'Média', value: formatClock(cpu.clock.avg) }]} />
        <SensorCard title="Consumo" icon={Zap} value={formatPower(cpu.power.current)} gaugeValue={cpu.power.current} gaugeMax={230} gaugeUnit="W" details={[{ label: 'Mín', value: formatPower(cpu.power.min) }, { label: 'Máx', value: formatPower(cpu.power.max) }, { label: 'TDP', value: '170W' }]} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5"><RealtimeChart dataKey="cpuTemp" color="var(--color-primary)" label="Temperatura CPU - Últimos 60 pontos" height={250} /></div>
        <div className="glass-card p-5"><RealtimeChart dataKey="cpuUsage" color="#00ff88" label="Uso CPU - Últimos 60 pontos" height={250} /></div>
      </div>
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Hash className="w-4 h-4 text-[var(--color-primary)]" />Núcleos ({cpu.cores}C / {cpu.threads}T)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {cpu.coreDetails.map((core) => (
            <div key={core.core} className="glass-card p-3 text-center">
              <span className="text-xs text-[var(--color-muted)]">Core {core.core}</span>
              <div className="text-sm font-mono font-bold mt-1" style={{ color: getTempColor(core.temperature) }}>{formatTemp(core.temperature)}</div>
              <div className="text-xs font-mono text-[var(--color-muted)]">{formatPercent(core.usage)}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
