import { motion } from 'framer-motion';

interface SparklinePoint {
  value: number;
}

interface MiniSparklineProps {
  data: SparklinePoint[];
  color?: string;
  label?: string;
  height?: number;
}

export default function MiniSparkline({ data, color = 'var(--color-primary)', label, height = 80 }: MiniSparklineProps) {
  if (data.length < 2) {
    return (
      <div className="flex flex-col gap-2">
        {label && <span className="text-xs text-[var(--color-muted)] font-medium">{label}</span>}
        <div className="flex items-center justify-center" style={{ height }}>
          <span className="text-xs text-[var(--color-muted)]">Aguardando dados...</span>
        </div>
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 280;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 10) - 5;
    return `${x},${y}`;
  });
  const pathD = `M${points.join(' L')}`;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const current = values[values.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-2"
    >
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-muted)] font-medium">{label}</span>
          <span className="text-xs font-mono font-semibold" style={{ color }}>
            {current.toFixed(1)}
            {label === 'CPU' || label === 'GPU' ? '°C' : '%'}
          </span>
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <motion.path
          d={`${pathD} L${width},${height} L0,${height} Z`}
          fill={`url(#gradient-${label})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
        <motion.circle
          cx={width}
          cy={values.length > 0 ? height - ((current - min) / range) * (height - 10) - 5 : height / 2}
          r="3"
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="flex justify-between text-[10px] text-[var(--color-muted)] font-mono">
        <span>Min: {min.toFixed(1)}</span>
        <span>Média: {avg.toFixed(1)}</span>
        <span>Max: {max.toFixed(1)}</span>
      </div>
    </motion.div>
  );
}
