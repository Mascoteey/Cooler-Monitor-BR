import { useEffect, useRef, useState } from 'react';
import { Cpu, Monitor, MemoryStick, Fan, Thermometer, Activity, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';

interface DisplayData {
  cpuTemp: number;
  cpuUsage: number;
  gpuTemp: number;
  gpuUsage: number;
  ramUsed: number;
  ramTotal: number;
  ramPct: number;
  fanRpm: number;
  cpuClock: number;
}

const FONT_MAP = { small: '11px', medium: '13px', large: '16px' };
const LINE_HEIGHT = { small: '16px', medium: '18px', large: '22px' };

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0GB';
  const gb = bytes / 1.074e9;
  return gb >= 1024 ? `${(gb / 1024).toFixed(1)}TB` : `${gb.toFixed(1)}GB`;
}

export default function OverlayDisplay() {
  const config = useStore((s) => s.overlayConfig);
  const [data, setData] = useState<DisplayData | null>(null);
  const [fps, setFps] = useState(0);
  const frameRef = useRef(0);
  const lastFrame = useRef(performance.now());
  const fpsFrames = useRef<number[]>([]);

  useEffect(() => {
    const cleanup = window.electronAPI?.onHardwareData((d: any) => {
      if (!d) return;
      setData({
        cpuTemp: Math.round(d.cpu?.temperature?.current ?? 0),
        cpuUsage: Math.round(d.cpu?.usage?.current ?? 0),
        gpuTemp: Math.round(d.gpu?.temperature?.current ?? 0),
        gpuUsage: Math.round(d.gpu?.usage?.current ?? 0),
        ramUsed: d.ram?.used ?? 0,
        ramTotal: d.ram?.total ?? 0,
        ramPct: Math.round(d.ram?.usage?.current ?? 0),
        fanRpm: Math.round((d.fans?.[0]?.rpm ?? 0) + (d.fans?.[1]?.rpm ?? 0)),
        cpuClock: Math.round(d.cpu?.clock?.current ?? 0),
      });
    });
    return () => { cleanup?.(); };
  }, []);

  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      const now = performance.now();
      fpsFrames.current.push(now);
      const cutoff = now - 1000;
      fpsFrames.current = fpsFrames.current.filter((t) => t > cutoff);
      setFps(fpsFrames.current.length);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(frameRef.current); };
  }, []);

  const fontSize = FONT_MAP[config.fontSize];
  const lineH = LINE_HEIGHT[config.fontSize];
  const posClass = config.position === 'top-left' ? 'top-3 left-3' :
    config.position === 'top-right' ? 'top-3 right-3' :
    config.position === 'bottom-left' ? 'bottom-3 left-3' : 'bottom-3 right-3';

  const iconSize = config.fontSize === 'small' ? 10 : config.fontSize === 'large' ? 14 : 12;

  return (
    <div className="h-full w-full relative overflow-hidden select-none"
      style={{
        background: 'transparent',
        fontFamily: "'JetBrains Mono', 'Consolas', monospace",
        color: 'rgba(255,255,255,0.9)',
      }}>
      <div className={`absolute ${posClass}`}
        style={{ opacity: config.opacity, fontSize, lineHeight: lineH }}>
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10 shadow-lg shadow-black/30 min-w-[160px]">
          {config.showFps && (
            <div className="flex items-center gap-1.5">
              <Activity className="text-green-400" style={{ width: iconSize, height: iconSize }} />
              <span className="font-bold" style={{
                color: fps >= 120 ? '#22c55e' : fps >= 60 ? '#fbbf24' : '#ef4444'
              }}>{fps} FPS</span>
            </div>
          )}
          {config.showCpu && data && (
            <div className="flex items-center gap-1.5">
              <Cpu className="text-[#00b4ff]" style={{ width: iconSize, height: iconSize }} />
              <span className="text-[#00b4ff]">{data.cpuTemp}°C</span>
              <span className="text-white/60">{data.cpuUsage}%</span>
              {config.showClock && data && (
                <span className="text-[#fbbf24] text-[90%]">{(data.cpuClock / 1000).toFixed(1)}GHz</span>
              )}
            </div>
          )}
          {config.showGpu && data && (
            <div className="flex items-center gap-1.5">
              <Monitor className="text-[#b400ff]" style={{ width: iconSize, height: iconSize }} />
              <span className="text-[#b400ff]">{data.gpuTemp}°C</span>
              <span className="text-white/60">{data.gpuUsage}%</span>
            </div>
          )}
          {config.showTemp && data && (
            <div className="flex items-center gap-1.5">
              <Thermometer className="text-[#22c55e]" style={{ width: iconSize, height: iconSize }} />
              <span className="text-[#22c55e]">{data.ramPct}%</span>
              <span className="text-white/60">RAM</span>
            </div>
          )}
          {config.showRam && data && (
            <div className="flex items-center gap-1.5">
              <MemoryStick className="text-[#22c55e]" style={{ width: iconSize, height: iconSize }} />
              <span className="text-white/80">{formatBytes(data.ramUsed)}/{formatBytes(data.ramTotal)}</span>
            </div>
          )}
          {config.showFans && data && (
            <div className="flex items-center gap-1.5">
              <Fan className="text-[#00f5ff]" style={{ width: iconSize, height: iconSize }} />
              <span className="text-[#00f5ff]">{data.fanRpm} RPM</span>
            </div>
          )}
          {(config.showClock && !config.showCpu) && data && (
            <div className="flex items-center gap-1.5">
              <Clock className="text-[#fbbf24]" style={{ width: iconSize, height: iconSize }} />
              <span className="text-[#fbbf24]">{(data.cpuClock / 1000).toFixed(1)}GHz</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
