import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import GaugeChart from './GaugeChart';

interface SensorCardProps {
  title: string;
  value: string;
  valueColor?: string;
  subtitle?: string;
  icon: LucideIcon;
  percent?: number;
  gaugeValue?: number;
  gaugeMax?: number;
  gaugeUnit?: string;
  details?: Array<{ label: string; value: string; color?: string }>;
  delay?: number;
}

export default function SensorCard({
  title,
  value,
  valueColor = 'var(--color-primary)',
  subtitle,
  icon: Icon,
  percent,
  gaugeValue,
  gaugeMax = 100,
  gaugeUnit = '%',
  details = [],
  delay = 0,
}: SensorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.05 }}
      className="sensor-card glass-card p-5 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
            {subtitle && (
              <p className="text-xs text-[var(--color-muted)] mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {gaugeValue !== undefined && (
          <GaugeChart
            value={gaugeValue}
            max={gaugeMax}
            unit={gaugeUnit}
            size={64}
            strokeWidth={5}
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold font-mono" style={{ color: valueColor }}>
          {value}
        </span>
        {percent !== undefined && (
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percent, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${valueColor}, var(--color-accent))` }}
            />
          </div>
        )}
      </div>

      {details.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2 border-t border-[var(--color-border)]">
          {details.map((detail, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-xs text-[var(--color-muted)]">{detail.label}</span>
              <span
                className="text-xs font-mono font-medium"
                style={{ color: detail.color || 'var(--color-text)' }}
              >
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
