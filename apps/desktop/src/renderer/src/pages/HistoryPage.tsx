import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import RealtimeChart from '../components/charts/RealtimeChart';
import { useStore } from '../store/useStore';

const timeRanges = [
  { key: '5m', label: '5 min', points: 300 },
  { key: '15m', label: '15 min', points: 900 },
  { key: '30m', label: '30 min', points: 1800 },
  { key: '1h', label: '1 hora', points: 3600 },
  { key: '6h', label: '6 horas', points: 21600 },
  { key: '12h', label: '12 horas', points: 43200 },
  { key: '24h', label: '24 horas', points: 86400 },
];

export default function HistoryPage() {
  const [range, setRange] = React.useState('1h');
  const history = useStore((s) => s.history);
  const currentRange = timeRanges.find((r) => r.key === range) || timeRanges[3];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Histórico" subtitle="Evolução de temperaturas e uso" icon={BarChart3} action={
        <div className="flex items-center gap-2">
          {timeRanges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                range === r.key
                  ? 'bg-[var(--color-primary)] text-white shadow-neon'
                  : 'bg-white/5 text-[var(--color-muted)] hover:bg-white/10'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      } />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <RealtimeChart dataKey="cpuTemp" color="var(--color-primary)" label="CPU Temperatura" points={currentRange.points} height={300} />
        </div>
        <div className="glass-card p-5">
          <RealtimeChart dataKey="gpuTemp" color="var(--color-secondary)" label="GPU Temperatura" points={currentRange.points} height={300} />
        </div>
        <div className="glass-card p-5">
          <RealtimeChart dataKey="cpuUsage" color="#00ff88" label="CPU Uso" points={currentRange.points} height={300} />
        </div>
        <div className="glass-card p-5">
          <RealtimeChart dataKey="ramUsage" color="#b400ff" label="RAM Uso" points={currentRange.points} height={300} />
        </div>
      </div>
    </motion.div>
  );
}