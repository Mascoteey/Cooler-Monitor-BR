import { Minus, Square, X, Monitor } from 'lucide-react';

export default function TitleBar() {
  return (
    <div className="title-bar flex items-center justify-between h-9 px-4 bg-[#050510] border-b border-[var(--color-border)] select-none">
      <div className="flex items-center gap-2">
        <Monitor className="w-4 h-4 text-[var(--color-primary)]" />
        <span className="text-xs font-semibold text-[var(--color-muted)] tracking-wider uppercase">
          COOLER MONITOR BR
        </span>
      </div>
      <div className="flex items-center gap-1 title-bar-button">
        <button
          onClick={() => window.electronAPI?.minimize()}
          className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--color-muted)] hover:text-white transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => window.electronAPI?.maximize()}
          className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--color-muted)] hover:text-white transition-colors"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => window.electronAPI?.close()}
          className="p-1.5 rounded-lg hover:bg-red-500/20 text-[var(--color-muted)] hover:text-red-400 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
