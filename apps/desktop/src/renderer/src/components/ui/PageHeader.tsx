import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon: Icon, action }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-6"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 flex items-center justify-center neon-border">
          <Icon className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">{title}</h1>
          {subtitle && <p className="text-sm text-[var(--color-muted)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
