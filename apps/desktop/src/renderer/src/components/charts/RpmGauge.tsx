import { useMemo } from 'react';

interface Props {
  rpm: number;
  minRpm?: number;
  maxRpm?: number;
  size?: number;
}

export default function RpmGauge({ rpm, minRpm = 0, maxRpm = 2500, size = 120 }: Props) {
  const pct = Math.min(1, Math.max(0, (rpm - minRpm) / (maxRpm - minRpm)));
  const angle = pct * 270;
  const rad = (angle * Math.PI) / 180;
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const startAngle = -225 * (Math.PI / 180);

  const needleX = cx + r * Math.cos(startAngle + rad);
  const needleY = cy + r * Math.sin(startAngle + rad);

  const color = pct > 0.85 ? '#ef4444' : pct > 0.65 ? '#fbbf24' : '#22c55e';

  const dashArray = useMemo(() => {
    const circumference = 2 * Math.PI * r;
    return `${circumference * 0.75 * pct} ${circumference}`;
  }, [r, pct]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a1a3e" strokeWidth={6} transform={`rotate(135 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#gauge-grad)" strokeWidth={6} strokeDasharray={dashArray} strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`} />
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={3} fill={color} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#e2e8f0" fontSize={size * 0.12} fontWeight={700} fontFamily="'JetBrains Mono', monospace">
        {rpm.toFixed(0)}
      </text>
      <text x={cx} y={cy + size * 0.16} textAnchor="middle" fill="#64748b" fontSize={size * 0.07} fontFamily="'JetBrains Mono', monospace">
        RPM
      </text>
    </svg>
  );
}
