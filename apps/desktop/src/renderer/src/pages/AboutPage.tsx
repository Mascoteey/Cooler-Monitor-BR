import { motion } from 'framer-motion';
import { Info, Github, Heart, Cpu, Zap, Award, Layers } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

export default function AboutPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl">
      <PageHeader title="Sobre" subtitle="COOLER MONITOR BR v1.0.0" icon={Info} />
      <div className="glass-card p-8 text-center space-y-6">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] flex items-center justify-center animate-pulse-glow">
          <Cpu className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold gradient-text">COOLER MONITOR BR</h2>
          <p className="text-[var(--color-muted)] mt-2">Monitoramento profissional de hardware para Windows</p>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--color-border)]">
          <div className="p-4 rounded-xl bg-white/5"><span className="block text-2xl font-bold font-mono text-[var(--color-primary)]">1.0.0</span><span className="text-xs text-[var(--color-muted)]">Versão</span></div>
          <div className="p-4 rounded-xl bg-white/5"><span className="block text-2xl font-bold font-mono text-[var(--color-secondary)]">Electron 28</span><span className="text-xs text-[var(--color-muted)]">Framework</span></div>
          <div className="p-4 rounded-xl bg-white/5"><span className="block text-2xl font-bold font-mono text-[var(--color-accent)]">React 18</span><span className="text-xs text-[var(--color-muted)]">UI Library</span></div>
        </div>
        <div className="space-y-3 text-sm">
          <p className="text-[var(--color-muted)]">Desenvolvido com <Heart className="w-4 h-4 inline text-red-500" /> no Brasil por <span className="text-[var(--color-primary)] font-semibold">Mascoteey</span></p>
          <p className="text-[var(--color-muted)]">LibreHardwareMonitor • Electron • React • TypeScript • TailwindCSS</p>
          <p className="text-xs text-[var(--color-muted)]">Criado com assistência da <span className="text-[#10a37f] font-medium">OpenCode AI</span></p>
        </div>
        <div className="flex items-center justify-center gap-4 pt-4">
          <a href="https://github.com/Mascoteey/Cooler-Monitor-BR" target="_blank" className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--color-muted)] transition-colors"><Github className="w-4 h-4" /> GitHub</a>
          <a href="#" className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--color-muted)] transition-colors"><Award className="w-4 h-4" /> Licença MIT</a>
        </div>
      </div>
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-[var(--color-primary)]" />Tecnologias</h3>
        <div className="flex flex-wrap gap-2">
          {['Electron 28', 'React 18', 'TypeScript 5', 'Vite 5', 'TailwindCSS 3', 'Framer Motion', 'Recharts', 'Zustand', 'React Query', 'Prisma ORM', 'SQLite', 'LibreHardwareMonitor', 'Node.js', 'Express', 'WebSocket'].map((tech) => (
            <span key={tech} className="px-3 py-1 rounded-full bg-white/5 text-xs text-[var(--color-muted)] border border-white/10">{tech}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}