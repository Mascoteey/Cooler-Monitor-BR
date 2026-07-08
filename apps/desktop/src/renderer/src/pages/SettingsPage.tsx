import { motion } from 'framer-motion';
import { Settings, Palette, Globe, Monitor, HardDrive, Bell, Wrench, Shield, Info, ChevronRight } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useStore } from '../store/useStore';

const settingsSections = [
  { key: 'general', label: 'Geral', icon: Settings, items: ['Idioma', 'Inicialização automática', 'Minimizar na bandeja', 'Intervalo de atualização'] },
  { key: 'appearance', label: 'Aparência', icon: Palette, items: ['Tema', 'Escala da interface', 'Opacidade', 'Animações'] },
  { key: 'overlay', label: 'Overlay', icon: Monitor, items: ['Ativar overlay', 'Posição', 'Itens exibidos', 'Opacidade', 'FPS no overlay'] },
  { key: 'alerts', label: 'Alertas', icon: Bell, items: ['Alertas de temperatura', 'Notificações Windows', 'Sons', 'Popups'] },
  { key: 'updates', label: 'Atualizações', icon: Wrench, items: ['Verificar automaticamente', 'Canal de atualização', 'Auto-instalação'] },
  { key: 'advanced', label: 'Avançado', icon: Shield, items: ['Logs detalhados', 'Depuração', 'Hardware bridge', 'Reset configurações'] },
];

export default function SettingsPage() {
  const { settings, setSettings, theme, setTheme } = useStore();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl">
      <PageHeader title="Configurações" subtitle="Personalize o COOLER MONITOR BR" icon={Settings} />
      <div className="glass-card p-5 space-y-6">
        {settingsSections.map((section) => (
          <motion.div key={section.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border)]">
              <section.icon className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="text-sm font-semibold">{section.label}</h3>
            </div>
            <div className="space-y-3">
              {section.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-sm text-[var(--color-text)]">{item}</span>
                  {item === 'Tema' && (
                    <select
                      value={theme.mode}
                      onChange={(e) => setTheme({ ...theme, mode: e.target.value as any })}
                      className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    >
                      <option value="dark">Dark</option>
                      <option value="black">Black</option>
                      <option value="blue">Blue</option>
                      <option value="purple">Purple</option>
                      <option value="green">Green</option>
                      <option value="red">Red</option>
                      <option value="custom">Custom</option>
                    </select>
                  )}
                  {item === 'Idioma' && (
                    <select className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-sm">
                      <option>Português (BR)</option>
                      <option>English</option>
                      <option>Español</option>
                    </select>
                  )}
                  {item === 'Intervalo de atualização' && (
                    <select className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-sm">
                      <option>500ms</option>
                      <option>1000ms</option>
                      <option>2000ms</option>
                      <option>5000ms</option>
                    </select>
                  )}
                  {!['Tema', 'Idioma', 'Intervalo de atualização'].includes(item) && (
                    <button className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-xs text-[var(--color-muted)] hover:bg-white/20">Configurar</button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}