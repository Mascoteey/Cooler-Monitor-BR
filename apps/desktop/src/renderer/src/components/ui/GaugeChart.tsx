import { motion } from 'framer-motion';

interface GaugeChartProps {
  value: number;
  max: number;
  unit?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export default function GaugeChart({
  value,
  max,
  unit = '%',
  size = 60,
  strokeWidth = 4,
  color,
}: GaugeChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - percentage);

  const getColor = () => {
    if (color) return color;
    const pct = percentage * 100;
    if (pct >= 85) return '#ff0044';
    if (pct >= 70) return '#ff6600';
    return 'var(--color-primary)';
  };

  const glowColor = getColor();

  return (
    <div className="gauge-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={glowColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
        />
      </svg>
      <div className="gauge-value flex flex-col items-center justify-center" style={{ fontSize: size * 0.22 }}>
        <span className="font-bold font-mono leading-none" style={{ color: glowColor }}>
          {value.toFixed(percentage < 1 ? 1 : 0)}
        </span>
        <span className="text-[8px] font-mono text-[var(--color-muted)] leading-none mt-0.5">{unit}</span>
      </div>
    </div>
  );
}
