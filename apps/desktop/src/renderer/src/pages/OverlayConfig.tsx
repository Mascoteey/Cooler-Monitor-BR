import { motion } from 'framer-motion';
import { Eye, Cpu, Monitor, MemoryStick, Fan, Activity, Thermometer, Gauge, Plus, Trash2, Clock, Layers } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useStore } from '../store/useStore';

const POSITIONS = [
  { id: 'top-left', label: 'Canto Superior Esquerdo' },
  { id: 'top-right', label: 'Canto Superior Direito' },
  { id: 'bottom-left', label: 'Canto Inferior Esquerdo' },
  { id: 'bottom-right', label: 'Canto Inferior Direito' },
];

const FONT_SIZES = [
  { id: 'small', label: 'Pequeno', preview: '12px' },
  { id: 'medium', label: 'Médio', preview: '14px' },
  { id: 'large', label: 'Grande', preview: '18px' },
];

export default function OverlayConfig() {
  const config = useStore((s) => s.overlayConfig);
  const setConfig = useStore((s) => s.setOverlayConfig);

  const toggleItem = (key: keyof typeof config) => {
    if (key === 'enabled' || key === 'showCpu' || key === 'showGpu' || key === 'showRam' || key === 'showFans' || key === 'showFps' || key === 'showClock' || key === 'showTemp') {
      setConfig({ [key]: !config[key] });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl">
      <PageHeader title="Overlay" subtitle="Configuração da sobreposição transparente" icon={Eye} />

      <div className="glass-card p-5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Overlay de Hardware</h3>
            <p className="text-xs text-[var(--color-muted)] mt-1">Mostra informações sobrepondo outros programas</p>
          </div>
          <button onClick={() => toggleItem('enabled')}
            className={`relative w-12 h-6 rounded-full transition-colors ${config.enabled ? 'bg-[var(--color-primary)]' : 'bg-[#1a1a3e]'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        {config.enabled && (
          <>
            <div className="border-t border-[#1a1a3e] pt-4 space-y-4">
              <h4 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Informações para Exibir</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'showCpu', icon: Cpu, label: 'CPU' },
                  { key: 'showGpu', icon: Monitor, label: 'GPU' },
                  { key: 'showRam', icon: MemoryStick, label: 'RAM' },
                  { key: 'showFans', icon: Fan, label: 'Ventoinhas' },
                  { key: 'showFps', icon: Activity, label: 'FPS' },
                  { key: 'showClock', icon: Clock, label: 'Clock' },
                  { key: 'showTemp', icon: Thermometer, label: 'Temperatura' },
                ].map((item) => (
                  <button key={item.key} onClick={() => toggleItem(item.key as keyof typeof config)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      config[item.key as keyof typeof config]
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]10'
                        : 'border-[#1a1a3e] bg-white/5'
                    }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      config[item.key as keyof typeof config] ? 'bg-[var(--color-primary)]20' : 'bg-white/5'
                    }`}>
                      <item.icon className={`w-4 h-4 ${config[item.key as keyof typeof config] ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}`} />
                    </div>
                    <span className={`text-xs font-medium ${config[item.key as keyof typeof config] ? 'text-white' : 'text-[var(--color-muted)]'}`}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#1a1a3e] pt-4 space-y-4">
              <h4 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Posição na Tela</h4>
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map((pos) => (
                  <button key={pos.id} onClick={() => setConfig({ position: pos.id as any })}
                    className={`p-3 rounded-xl border text-xs text-left transition-all ${
                      config.position === pos.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]10 text-white'
                        : 'border-[#1a1a3e] bg-white/5 text-[var(--color-muted)]'
                    }`}>
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#1a1a3e] pt-4 space-y-4">
              <h4 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Tamanho da Fonte</h4>
              <div className="flex gap-2">
                {FONT_SIZES.map((fs) => (
                  <button key={fs.id} onClick={() => setConfig({ fontSize: fs.id as any })}
                    className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                      config.fontSize === fs.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]10'
                        : 'border-[#1a1a3e] bg-white/5'
                    }`}>
                    <span className="text-xs text-[var(--color-muted)]">{fs.label}</span>
                    <p className="font-mono font-bold text-white mt-1" style={{ fontSize: fs.preview }}>1280×720</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#1a1a3e] pt-4 space-y-4">
              <h4 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Opacidade</h4>
              <div className="flex items-center gap-4">
                <input type="range" min="0.1" max="1" step="0.05" value={config.opacity}
                  onChange={(e) => setConfig({ opacity: parseFloat(e.target.value) })}
                  className="flex-1 h-2 rounded-full appearance-none bg-[#1a1a3e] accent-[var(--color-primary)]" />
                <span className="text-xs font-mono text-[var(--color-muted)] w-12 text-right">{Math.round(config.opacity * 100)}%</span>
              </div>
            </div>

            <div className="border-t border-[#1a1a3e] pt-4">
              <p className="text-xs text-[var(--color-muted)]">
                <strong>Dica:</strong> Minimize a janela principal para ativar o overlay. Ele aparecerá sobre outros programas.
                Use <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono">Ctrl+Shift+O</kbd> para alternar visibilidade.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Layers className="w-4 h-4 text-[var(--color-primary)]" /> Pré-visualização</h3>
        <div className="relative w-full h-48 rounded-xl bg-gradient-to-br from-[#0a0a1a] to-[#111133] overflow-hidden border border-[#1a1a3e]">
          <div className={`absolute top-2 ${config.position === 'top-left' ? 'left-2' : config.position === 'top-right' ? 'right-2' : config.position === 'bottom-left' ? 'bottom-2 left-2' : 'bottom-2 right-2'} space-y-1`}
            style={{ opacity: config.opacity, fontSize: config.fontSize === 'small' ? '11px' : config.fontSize === 'large' ? '15px' : '13px' }}>
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10 font-mono leading-relaxed text-white/90">
              {config.showFps && <div className="flex items-center gap-2"><Activity className="w-3 h-3 text-green-400" /><span className="text-green-400 font-bold">144 FPS</span></div>}
              {config.showCpu && <div>CPU: <span className="text-[#00b4ff]">45°C</span> 12%</div>}
              {config.showGpu && <div>GPU: <span className="text-[#b400ff]">38°C</span> 8%</div>}
              {config.showTemp && <div>RAM: <span className="text-[#22c55e]">32%</span></div>}
              {config.showClock && <div>Clock: <span className="text-[#fbbf24]">4.5GHz</span></div>}
              {config.showRam && <div>RAM: 8.2/32.0 GB</div>}
              {config.showFans && <div>FAN: 1200 RPM</div>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
