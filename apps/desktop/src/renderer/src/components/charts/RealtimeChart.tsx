import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useStore } from '../../store/useStore';
import { useMemo } from 'react';

interface RealtimeChartProps {
  dataKey: 'cpuTemp' | 'gpuTemp' | 'cpuUsage' | 'ramUsage';
  color?: string;
  label?: string;
  points?: number;
  height?: number;
}

export default function RealtimeChart({
  dataKey,
  color = '#00b4ff',
  label,
  points = 60,
  height = 200,
}: RealtimeChartProps) {
  const history = useStore((s) => s.history);
  const data = useMemo(() => {
    const slice = history.slice(-points);
    return slice.map((entry) => ({
      time: new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      value: entry[dataKey],
    }));
  }, [history, dataKey, points]);

  return (
    <div className="w-full">
      {label && <span className="text-xs text-[var(--color-muted)] font-medium mb-2 block">{label}</span>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              background: 'rgba(17,17,34,0.95)',
              border: '1px solid rgba(26,26,62,0.8)',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#grad-${dataKey})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
