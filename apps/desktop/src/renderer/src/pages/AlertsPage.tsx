import { motion } from 'framer-motion';
import { Bell, AlertTriangle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useStore } from '../store/useStore';

export default function AlertsPage() {
  const { alerts, addAlert, dismissAlert } = useStore();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Alertas" subtitle="Sistema de notificações inteligente" icon={Bell} action={
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> Novo
        </button>
      } />
      <div className="glass-card p-5">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-[var(--color-muted)]/50 mb-4" />
            <p className="text-[var(--color-muted)]">Nenhum alerta ativo</p>
            <p className="text-xs text-[var(--color-muted)]/50 mt-1">Configure alertas nas configurações</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  alert.type === 'critical' ? 'bg-red-500/20 text-red-400' :
                  alert.type === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {alert.type === 'critical' ? <AlertCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)]">{alert.message}</p>
                  <p className="text-xs text-[var(--color-muted)]">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
                <button onClick={() => dismissAlert(alert.id)} className="p-1.5 hover:bg-white/5 rounded-lg text-[var(--color-muted)]"><Trash2 className="w-4 h-4" /></button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}