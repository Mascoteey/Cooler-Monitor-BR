import { motion } from 'framer-motion';
import { Network, Wifi, Cable, Activity } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useStore } from '../store/useStore';
import { formatBytes, formatSpeed } from '../utils/formatters';

export default function NetworkPage() {
  const data = useStore((s) => s.hardwareData);
  if (!data) return null;
  const { network } = data;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Rede" subtitle={`${network.length} interface(s)`} icon={Network} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {network.map((net, i) => (
          <div key={i} className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center">
                {net.name.toLowerCase().includes('wi') ? <Wifi className="w-5 h-5 text-green-400" /> : <Cable className="w-5 h-5 text-green-400" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{net.name}</h3>
                <p className="text-xs text-[var(--color-muted)]">{net.ip}</p>
              </div>
              <span className={`ml-auto px-2 py-1 text-xs rounded-full ${net.status === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {net.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-[var(--color-muted)]">Velocidade</span><p className="text-sm font-mono font-bold">{net.speed} Mbps</p></div>
              <div><span className="text-xs text-[var(--color-muted)]">Ping</span><p className="text-sm font-mono font-bold">{net.ping.toFixed(0)} ms</p></div>
              <div><span className="text-xs text-[var(--color-muted)]">Download</span><p className="text-sm font-mono font-bold text-green-400">{formatSpeed(net.downloadSpeed)}/s</p></div>
              <div><span className="text-xs text-[var(--color-muted)]">Upload</span><p className="text-sm font-mono font-bold text-blue-400">{formatSpeed(net.uploadSpeed)}/s</p></div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}