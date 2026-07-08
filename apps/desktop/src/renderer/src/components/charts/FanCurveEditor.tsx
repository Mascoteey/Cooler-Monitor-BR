import { useState, useRef, useCallback, useEffect } from 'react';
import { FanCurvePoint } from '@cooler-monitor/shared';

interface Props {
  points: FanCurvePoint[];
  onChange: (points: FanCurvePoint[]) => void;
  width?: number;
  height?: number;
  readOnly?: boolean;
}

export default function FanCurveEditor({ points: initial, onChange, width = 400, height = 200, readOnly = false }: Props) {
  const [points, setPoints] = useState<FanCurvePoint[]>(initial);
  const [dragging, setDragging] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pad = { t: 20, r: 20, b: 30, l: 40 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;

  const xScale = (t: number) => pad.l + ((t - 20) / 80) * plotW;
  const yScale = (p: number) => pad.t + plotH - (p / 100) * plotH;
  const xInv = (px: number) => Math.max(20, Math.min(100, 20 + ((px - pad.l) / plotW) * 80));
  const yInv = (py: number) => Math.max(0, Math.min(100, 100 - ((py - pad.t) / plotH) * 100));

  useEffect(() => { setPoints(initial); }, [initial]);

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const handleMouseDown = useCallback((idx: number) => (e: React.MouseEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setDragging(idx);
  }, [readOnly]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging === null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const newTemp = clamp(Math.round(xInv(px) / 5) * 5, 20, 100);
    const newPwm = clamp(Math.round(yInv(py) / 5) * 5, 0, 100);
    const updated = points.map((p, i) => {
      if (i === dragging) return { temp: newTemp, pwm: newPwm };
      if (i === dragging - 1 && newTemp <= p.temp) return { ...p, temp: newTemp - 5 };
      if (i === dragging + 1 && newTemp >= p.temp) return { ...p, temp: newTemp + 5 };
      return p;
    });
    const sorted = updated.sort((a, b) => a.temp - b.temp);
    setPoints(sorted);
    onChange(sorted);
  }, [dragging, points, onChange, xInv, yInv]);

  const handleMouseUp = useCallback(() => {
    if (dragging !== null) {
      setDragging(null);
      onChange(points);
    }
  }, [dragging, points, onChange]);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.temp)},${yScale(p.pwm)}`).join(' ');

  const gridLines = {
    x: [30, 40, 50, 60, 70, 80, 90],
    y: [0, 20, 40, 60, 80, 100],
  };

  return (
    <svg ref={svgRef} width={width} height={height} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ cursor: dragging !== null ? 'grabbing' : readOnly ? 'default' : 'crosshair' }}>
      <rect x={0} y={0} width={width} height={height} fill="#0a0a1a" rx={8} />

      {gridLines.x.map((t) => (
        <line key={`gx${t}`} x1={xScale(t)} y1={pad.t} x2={xScale(t)} y2={pad.t + plotH} stroke="#1a1a3e" strokeWidth={1} />
      ))}
      {gridLines.y.map((p) => (
        <line key={`gy${p}`} x1={pad.l} y1={yScale(p)} x2={pad.l + plotW} y2={yScale(p)} stroke="#1a1a3e" strokeWidth={1} />
      ))}

      {gridLines.x.map((t) => (
        <text key={`lx${t}`} x={xScale(t)} y={pad.t + plotH + 16} textAnchor="middle" fill="#64748b" fontSize={10} fontFamily="'JetBrains Mono', monospace">{t}°</text>
      ))}
      {gridLines.y.map((p) => (
        <text key={`ly${p}`} x={pad.l - 6} y={yScale(p) + 4} textAnchor="end" fill="#64748b" fontSize={10} fontFamily="'JetBrains Mono', monospace">{p}%</text>
      ))}

      <text x={pad.l + plotW / 2} y={height - 4} textAnchor="middle" fill="#94a3b8" fontSize={10}>Temperatura (°C)</text>
      <text x={10} y={pad.t + plotH / 2} textAnchor="middle" fill="#94a3b8" fontSize={10} transform={`rotate(-90, 10, ${pad.t + plotH / 2})`}>PWM (%)</text>

      <path d={linePath} fill="none" stroke="#00b4ff" strokeWidth={2} strokeLinejoin="round" />

      {!readOnly && (
        <path d={`${linePath} L${xScale(100)},${yScale(100)} L${xScale(100)},${yScale(0)} Z`} fill="rgba(0,180,255,0.06)" />
      )}

      {points.map((p, i) => (
        <circle
          key={i}
          cx={xScale(p.temp)} cy={yScale(p.pwm)} r={dragging === i ? 7 : 5}
          fill={dragging === i ? '#00b4ff' : '#1a1a3e'}
          stroke="#00b4ff" strokeWidth={2}
          onMouseDown={handleMouseDown(i)}
          style={{ cursor: readOnly ? 'default' : 'grab' }}
        />
      ))}
    </svg>
  );
}
