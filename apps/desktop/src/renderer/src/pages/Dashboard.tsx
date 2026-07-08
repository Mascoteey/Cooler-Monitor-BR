import { motion } from 'framer-motion';
import { Cpu, Monitor, MemoryStick, HardDrive, Thermometer, Fan, Activity, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import SensorCard from '../components/ui/SensorCard';
import MiniSparkline from '../components/charts/MiniSparkline';
import { formatTemp, formatPercent, formatClock, formatPower, formatBytes, getTempColor, getUsageColor } from '../utils/formatters';

export default function Dashboard() {
  const data = useStore((s) => s.hardwareData);
  const history = useStore((s) => s.history);

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 flex items-center justify-center animate-pulse-glow">
            <Activity className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <p className="text-[var(--color-muted)] text-sm">Inicializando sensores...</p>
        </div>
      </div>
    );
  }

  const { cpu, gpu, ram, storage, motherboard, fans } = data;

  const tempHistory = history.slice(-60).map((e) => ({ value: e.cpuTemp }));
  const gpuTempHistory = history.slice(-60).map((e) => ({ value: e.gpuTemp }));
  const usageHistory = history.slice(-60).map((e) => ({ value: e.cpuUsage }));
  const ramHistory = history.slice(-60).map((e) => ({ value: e.ramUsage }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Monitoramento em tempo real do sistema</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] font-mono">
          <Clock className="w-3 h-3" />
          <span>Atualizado em tempo real</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <SensorCard
          title="CPU"
          subtitle={cpu.name}
          icon={Cpu}
          value={formatTemp(cpu.temperature.current)}
          valueColor={getTempColor(cpu.temperature.current)}
          gaugeValue={cpu.temperature.current}
          gaugeMax={100}
          gaugeUnit="°C"
          percent={cpu.usage.current}
          details={[
            { label: 'Uso', value: formatPercent(cpu.usage.current), color: getUsageColor(cpu.usage.current) },
            { label: 'Clock', value: formatClock(cpu.clock.current) },
            { label: 'Consumo', value: formatPower(cpu.power.current) },
            { label: 'Voltagem', value: `${cpu.voltage.current.toFixed(3)}V` },
            { label: 'Threads', value: String(cpu.threads) },
            { label: 'Mín', value: formatTemp(cpu.temperature.min) },
            { label: 'Máx', value: formatTemp(cpu.temperature.max), color: getTempColor(cpu.temperature.max) },
          ]}
        />

        <SensorCard
          title="GPU"
          subtitle={gpu.name}
          icon={Monitor}
          value={formatTemp(gpu.temperature.current)}
          valueColor={getTempColor(gpu.temperature.current)}
          gaugeValue={gpu.temperature.current}
          gaugeMax={100}
          gaugeUnit="°C"
          percent={gpu.usage.current}
          details={[
            { label: 'Hotspot', value: formatTemp(gpu.hotspot.current), color: getTempColor(gpu.hotspot.current) },
            { label: 'Uso', value: formatPercent(gpu.usage.current), color: getUsageColor(gpu.usage.current) },
            { label: 'Clock', value: formatClock(gpu.clock.current) },
            { label: 'VRAM', value: `${Math.round(gpu.vram.usagePercent)}%` },
            { label: 'Fan', value: `${gpu.fan.current.toFixed(0)} RPM` },
            { label: 'Consumo', value: formatPower(gpu.power.current) },
          ]}
        />

        <SensorCard
          title="Memória RAM"
          subtitle={`${ram.name} - ${Math.round(ram.total / 1073741824)}GB`}
          icon={MemoryStick}
          value={formatPercent(ram.usage.current)}
          valueColor={getUsageColor(ram.usage.current)}
          gaugeValue={ram.usage.current}
          gaugeMax={100}
          gaugeUnit="%"
          percent={ram.usage.current}
          details={[
            { label: 'Usado', value: formatBytes(ram.used), color: getUsageColor(ram.usage.current) },
            { label: 'Total', value: formatBytes(ram.total) },
            { label: 'Frequência', value: `${ram.frequency} MHz` },
            { label: 'Latência', value: `${ram.latency.toFixed(1)} ns` },
            { label: 'Canais', value: ram.channels.channel },
          ]}
        />

        <SensorCard
          title="Armazenamento"
          subtitle={storage[0]?.name || 'N/A'}
          icon={HardDrive}
          value={formatPercent(storage[0]?.usagePercent || 0)}
          valueColor={getUsageColor(storage[0]?.usagePercent || 0)}
          gaugeValue={storage[0]?.usagePercent || 0}
          gaugeMax={100}
          gaugeUnit="%"
          percent={storage[0]?.usagePercent || 0}
          details={[
            { label: 'Temperatura', value: formatTemp(storage[0]?.temperature.current || 0), color: getTempColor(storage[0]?.temperature.current || 0) },
            { label: 'Saúde', value: `${storage[0]?.health || 100}%` },
            { label: 'Leitura', value: `${storage[0]?.readSpeed || 0} MB/s` },
            { label: 'Escrita', value: `${storage[0]?.writeSpeed || 0} MB/s` },
            { label: 'Tipo', value: storage[0]?.type || 'N/A' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Thermometer className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="text-sm font-semibold">Temperaturas em Tempo Real</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <MiniSparkline data={tempHistory} color="var(--color-primary)" label="CPU" />
            <MiniSparkline data={gpuTempHistory} color="var(--color-secondary)" label="GPU" />
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="text-sm font-semibold">Uso do Sistema</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <MiniSparkline data={usageHistory} color="#00ff88" label="CPU" />
            <MiniSparkline data={ramHistory} color="#b400ff" label="RAM" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Thermometer className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-xs font-semibold text-[var(--color-muted)]">Placa Mãe</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-muted)]">Chipset</span>
              <span className="font-mono">{formatTemp(motherboard.chipset.temperature)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-muted)]">VRM</span>
              <span className="font-mono">{formatTemp(motherboard.vrm.temperature)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-muted)]">PCH</span>
              <span className="font-mono">{formatTemp(motherboard.pch.temperature)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-muted)]">Ambiente</span>
              <span className="font-mono">{formatTemp(motherboard.ambient.temperature)}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Fan className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-xs font-semibold text-[var(--color-muted)]">Coolers</span>
          </div>
          <div className="space-y-2">
            {fans.slice(0, 3).map((fan, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-[var(--color-muted)] truncate max-w-[100px]">{fan.name}</span>
                <span className="font-mono">{fan.rpm.toFixed(0)} RPM</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Monitor className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-xs font-semibold text-[var(--color-muted)]">Rede</span>
          </div>
          <div className="space-y-2">
            {data.network.slice(0, 1).map((net, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-muted)]">Status</span>
                  <span className="font-mono text-green-400">{net.status}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-muted)]">Download</span>
                  <span className="font-mono">{formatBytes(net.downloadSpeed)}/s</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-muted)]">Upload</span>
                  <span className="font-mono">{formatBytes(net.uploadSpeed)}/s</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-muted)]">Ping</span>
                  <span className="font-mono">{net.ping.toFixed(0)} ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-xs font-semibold text-[var(--color-muted)]">Sistema</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-muted)]">CPU Núcleos</span>
              <span className="font-mono">{cpu.cores}C / {cpu.threads}T</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-muted)]">GPU VRAM</span>
              <span className="font-mono">{formatBytes(gpu.vram.used)} / {formatBytes(gpu.vram.total)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-muted)]">RAM Total</span>
              <span className="font-mono">{formatBytes(ram.total)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-muted)]">Placa Mãe</span>
              <span className="font-mono text-xs truncate max-w-[120px]">{motherboard.name}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
