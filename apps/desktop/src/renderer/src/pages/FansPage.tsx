import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fan, Thermometer, Gauge, Volume2, Settings, ChevronDown, ChevronUp, RotateCcw, Cpu, Monitor, Wind, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import RpmGauge from '../components/charts/RpmGauge';
import FanCurveEditor from '../components/charts/FanCurveEditor';
import { useStore } from '../store/useStore';
import { FanCurvePoint } from '@cooler-monitor/shared';

const PROFILES = [
  { id: 'silent', label: 'Silencioso', color: '#22c55e', desc: 'Mínimo ruído, prioriza baixas rotações' },
  { id: 'balanced', label: 'Balanceado', color: '#fbbf24', desc: 'Equilíbrio entre ruído e desempenho' },
  { id: 'performance', label: 'Performance', color: '#ef4444', desc: 'Máxima refrigeração, maior ruído' },
];

function defaultCurve(profile: string): FanCurvePoint[] {
  switch (profile) {
    case 'silent': return [{ temp: 30, pwm: 10 }, { temp: 50, pwm: 20 }, { temp: 60, pwm: 35 }, { temp: 70, pwm: 50 }, { temp: 80, pwm: 70 }, { temp: 90, pwm: 90 }];
    case 'performance': return [{ temp: 30, pwm: 30 }, { temp: 50, pwm: 50 }, { temp: 60, pwm: 70 }, { temp: 70, pwm: 85 }, { temp: 80, pwm: 95 }, { temp: 90, pwm: 100 }];
    default: return [{ temp: 30, pwm: 15 }, { temp: 40, pwm: 20 }, { temp: 50, pwm: 30 }, { temp: 60, pwm: 45 }, { temp: 70, pwm: 65 }, { temp: 80, pwm: 85 }, { temp: 90, pwm: 100 }];
  }
}

const FAN_COLORS: Record<string, string> = {
  cpu: '#00b4ff',
  case: '#22c55e',
  gpu: '#b400ff',
};

export default function FansPage() {
  const data = useStore((s) => s.hardwareData);
  const addHistoryEntry = useStore((s) => s.addHistoryEntry);
  const [profile, setProfile] = useState<'silent' | 'balanced' | 'performance' | string>('balanced');
  const [expandedFan, setExpandedFan] = useState<number | null>(0);
  const [fanCurves, setFanCurves] = useState<Record<number, FanCurvePoint[]>>({});
  const [manualOverride, setManualOverride] = useState<Record<number, boolean>>({});
  const [manualPwm, setManualPwm] = useState<Record<number, number>>({});
  const [tempSource, setTempSource] = useState<Record<number, 'cpu' | 'gpu' | 'motherboard'>>({});
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [appliedProfile, setAppliedProfile] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showProfileMenu) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showProfileMenu]);

  const cpu = useStore((s) => s.hardwareData?.cpu);
  const gpu = useStore((s) => s.hardwareData?.gpu);

  const fans = useMemo(() => {
    if (!data) return [];
    return (data.fans || []).slice(0, 5);
  }, [data]);

  useEffect(() => {
    if (fans.length > 0 && Object.keys(fanCurves).length === 0) {
      const curves: Record<number, FanCurvePoint[]> = {};
      const override: Record<number, boolean> = {};
      const pwm: Record<number, number> = {};
      const src: Record<number, 'cpu' | 'gpu' | 'motherboard'> = {};
      fans.forEach((f, i) => {
        const c = defaultCurve(profile);
        curves[i] = f.curve && f.curve.length > 0 ? f.curve : c;
        override[i] = false;
        pwm[i] = f.pwm;
        src[i] = f.label === 'gpu' ? 'gpu' : 'cpu';
      });
      setFanCurves(curves);
      setManualOverride(override);
      setManualPwm(pwm);
      setTempSource(src);
    }
  }, [fans]);

  const currentTemp = useMemo(() => {
    const ct = cpu?.temperature?.current || 45;
    const gt = gpu?.temperature?.current || 40;
    return { cpu: ct, gpu: gt, motherboard: 35 };
  }, [cpu, gpu]);

  const applyProfile = (id: string) => {
    setProfile(id as any);
    if (id !== 'custom') {
      const curves: Record<number, FanCurvePoint[]> = {};
      const override: Record<number, boolean> = {};
      fans.forEach((_, i) => {
        curves[i] = defaultCurve(id);
        override[i] = false;
      });
      setFanCurves(curves);
      setManualOverride(override);
    }
    setAppliedProfile(id);
    setPendingChanges(true);
    setTimeout(() => setAppliedProfile(null), 2000);
    setShowProfileMenu(false);
  };

  const handleCurveChange = (idx: number, points: FanCurvePoint[]) => {
    setFanCurves((prev) => ({ ...prev, [idx]: points }));
    if (profile !== 'custom') setProfile('custom');
    setPendingChanges(true);
  };

  const handleManualPwmChange = (idx: number, val: number) => {
    setManualPwm((prev) => ({ ...prev, [idx]: val }));
    setManualOverride((prev) => ({ ...prev, [idx]: true }));
    setPendingChanges(true);
  };

  const releaseOverride = (idx: number) => {
    setManualOverride((prev) => ({ ...prev, [idx]: false }));
    setPendingChanges(true);
  };

  const applyChanges = useCallback(() => {
    setConfirming(true);
    const cmds: { name: string; pwm: number }[] = [];
    fans.forEach((fan, idx) => {
      if (manualOverride[idx]) {
        const pwm = manualPwm[idx] || 0;
        cmds.push({ name: fan.name, pwm });
        if (window.electronAPI?.setFanSpeed) {
          window.electronAPI.setFanSpeed(fan.name, pwm);
        }
      }
    });
    setPendingChanges(false);
    setTimeout(() => setConfirming(false), 1500);
  }, [fans, manualOverride, manualPwm]);

  const getTargetPwm = (fanIdx: number) => {
    if (manualOverride[fanIdx]) return manualPwm[fanIdx] || 0;
    const curve = fanCurves[fanIdx];
    if (!curve || curve.length === 0) return 50;
    const src = tempSource[fanIdx] || 'cpu';
    const temp = currentTemp[src] || 45;
    let p = curve[0].pwm;
    for (let i = 0; i < curve.length - 1; i++) {
      if (temp >= curve[i].temp && temp <= curve[i + 1].temp) {
        const t = (temp - curve[i].temp) / (curve[i + 1].temp - curve[i].temp);
        p = Math.round(curve[i].pwm + t * (curve[i + 1].pwm - curve[i].pwm));
        break;
      }
      if (temp >= curve[i + 1].temp) p = curve[i + 1].pwm;
    }
    return Math.max(0, Math.min(100, p));
  };

  const getTargetRpm = (fanIdx: number, fan: typeof fans[0]) => {
    const pwm = getTargetPwm(fanIdx);
    const maxR = fan.maxRpm || 2500;
    const minR = fan.minRpm || 0;
    return Math.round(minR + (pwm / 100) * (maxR - minR));
  };

  const totalRpm = fans.reduce((s, f, i) => s + f.rpm, 0);
  const totalTargetRpm = fans.reduce((s, f, i) => s + getTargetRpm(i, f), 0);
  const avgTemp = Object.values(currentTemp).reduce((s, t) => s + t, 0) / Object.values(currentTemp).length;

  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Fans & Controladoras" subtitle={`${fans.length} cooler(s) · ${totalTargetRpm.toFixed(0)} RPM alvo · ${avgTemp.toFixed(1)}°C médio`} icon={Fan} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { icon: Fan, label: 'Coolers', value: `${fans.length}`, color: '#00b4ff' },
          { icon: Gauge, label: 'RPM Alvo', value: `${totalTargetRpm.toFixed(0)}`, color: '#22c55e' },
          { icon: Wind, label: 'Fluxo Est.', value: `${(totalTargetRpm * 0.02).toFixed(1)} CFM`, color: '#00f5ff' },
          { icon: Volume2, label: 'Ruído Est.', value: totalRpm > 3000 ? 'Moderado' : totalRpm > 2000 ? 'Baixo' : 'Mínimo', color: totalRpm > 3000 ? '#fbbf24' : '#22c55e' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15` }}>
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">{stat.label}</p>
              <p className="text-lg font-bold font-mono" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="text-sm font-semibold">Perfil de Ventoinhas</h3>
            {appliedProfile && (
              <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${PROFILES.find((p) => p.id === appliedProfile)?.color}20`, color: PROFILES.find((p) => p.id === appliedProfile)?.color }}>
                ✓ Aplicado
              </motion.span>
            )}
          </div>
          <div className="relative" ref={profileRef}>
            <button onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#1a1a3e] hover:border-[var(--color-primary)] transition-colors"
              style={{ color: PROFILES.find((p) => p.id === profile)?.color ?? '#00b4ff' }}>
              {PROFILES.find((p) => p.id === profile)?.label ?? 'Customizado'}
              {showProfileMenu ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full mt-1 w-56 glass-card p-1 z-[100] border border-[#1a1a3e] shadow-xl shadow-black/50">
                  {PROFILES.map((p) => (
                    <button key={p.id} onClick={() => applyProfile(p.id)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#1a1a3e] transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span className="font-medium" style={{ color: p.color }}>{p.label}</span>
                      </div>
                      <p className="text-[var(--color-muted)] mt-0.5">{p.desc}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-2 text-xs text-[var(--color-muted)]">
              <Thermometer className="w-3 h-3" />
              Temperatura atual: CPU {currentTemp.cpu.toFixed(1)}°C · GPU {currentTemp.gpu.toFixed(1)}°C
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <Wind className="w-3 h-3" />
            Controle inteligente baseado em temperatura
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {fans.map((fan, idx) => {
          const expanded = expandedFan === idx;
          const color = FAN_COLORS[fan.label] || '#00b4ff';
          const targetPwm = getTargetPwm(idx);
          const isManual = manualOverride[idx];
          const targetRpm = getTargetRpm(idx, fan);
          const displayRpm = isManual ? targetRpm : fan.rpm;
          const curve = fanCurves[idx] || [];
          const tempSrc = tempSource[idx] || 'cpu';
          const currentTempVal = currentTemp[tempSrc] || 45;

          return (
            <motion.div key={idx} layout className="glass-card p-5">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedFan(expanded ? null : idx)}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                    <Fan className="w-6 h-6" style={{ color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{fan.name}</h3>
                    <p className="text-xs text-[var(--color-muted)]">
                      {fan.header || 'N/A'} · {fan.mode} · {isManual ? 'Manual' : profile === 'custom' ? 'Customizado' : PROFILES.find((p) => p.id === profile)?.label || profile}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <RpmGauge rpm={displayRpm} minRpm={fan.minRpm || 0} maxRpm={fan.maxRpm || 2500} size={80} />
                  <div className="text-right min-w-[48px]">
                    <p className="text-lg font-mono font-bold" style={{ color }}>{displayRpm.toFixed(0)}</p>
                    <p className="text-[10px] text-[var(--color-muted)]">{isManual ? 'Manual' : 'Alvo'}</p>
                  </div>
                  <div className="text-right min-w-[48px]">
                    <p className="text-sm font-mono font-bold" style={{ color: targetPwm > 70 ? '#ef4444' : targetPwm > 40 ? '#fbbf24' : '#22c55e' }}>
                      {targetPwm}%
                    </p>
                    <p className="text-[10px] text-[var(--color-muted)]">PWM</p>
                  </div>
                  {expanded ? <ChevronUp className="w-4 h-4 text-[var(--color-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-muted)]" />}
                </div>
              </div>

              <AnimatePresence>
                {expanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="border-t border-[#1a1a3e] mt-4 pt-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-semibold text-[var(--color-muted)]">Curva PWM (Temperatura × Ventoinha)</h4>
                            <button onClick={() => releaseOverride(idx)}
                              className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">
                              <RotateCcw className="w-3 h-3" /> Auto
                            </button>
                          </div>
                          <FanCurveEditor
                            key={`curve-${idx}-${profile}`}
                            points={curve}
                            onChange={(pts) => handleCurveChange(idx, pts)}
                            width={380}
                            height={200}
                            readOnly={manualOverride[idx]}
                          />
                          <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-muted)]">
                            <span>Fonte: </span>
                            {(['cpu', 'gpu', 'motherboard'] as const).map((s) => (
                              <button key={s} onClick={() => setTempSource((prev) => ({ ...prev, [idx]: s }))}
                                className={`px-2 py-0.5 rounded ${tempSrc === s ? 'text-white font-semibold' : ''}`}
                                style={{ background: tempSrc === s ? `${color}20` : 'transparent', color: tempSrc === s ? color : undefined }}>
                                {s === 'cpu' ? 'CPU' : s === 'gpu' ? 'GPU' : 'Placa Mãe'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="glass-card p-4 bg-[#0a0a1a]/50">
                            <h4 className="text-xs font-semibold text-[var(--color-muted)] mb-3">Controle Manual</h4>
                            <div className="flex items-center gap-4">
                              <button onClick={() => setManualOverride((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${manualOverride[idx] ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-[#1a1a3e] text-[var(--color-muted)]'}`}>
                                Override Manual
                              </button>
                              <div className="flex-1 flex items-center gap-3">
                                <span className="text-xs text-[var(--color-muted)] w-6">0%</span>
                                <input type="range" min={0} max={100} value={manualOverride[idx] ? manualPwm[idx] || 0 : targetPwm}
                                  onChange={(e) => handleManualPwmChange(idx, Number(e.target.value), fan.name)}
                                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                                  style={{ background: `linear-gradient(to right, ${color}40, ${color})`, height: 6, borderRadius: 3, accentColor: color }} />
                                <span className="text-xs text-[var(--color-muted)] w-6">100%</span>
                              </div>
                              <span className="text-sm font-mono font-bold" style={{ color }}>{manualOverride[idx] ? manualPwm[idx] || 0 : targetPwm}%</span>
                            </div>
                          </div>

                          <div className="glass-card p-4 bg-[#0a0a1a]/50">
                            <h4 className="text-xs font-semibold text-[var(--color-muted)] mb-2">Informações</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {[
                                { label: 'Velocidade', value: `${displayRpm.toFixed(0)} RPM` },
                                { label: 'Duty Cycle', value: `${targetPwm}${isManual ? '% (manual)' : '% (curva)'}` },
                                { label: 'Leitura real', value: `${fan.rpm.toFixed(0)} RPM / ${fan.pwm}%` },
                                { label: 'Min RPM', value: `${fan.minRpm || 0}` },
                                { label: 'Max RPM', value: `${fan.maxRpm || 2500}` },
                                { label: 'Modo', value: isManual ? 'Override Manual' : `${fan.mode} · Perfil` },
                                { label: 'Conector', value: fan.header || 'N/A' },
                                { label: 'Temp. ref.', value: `${currentTempVal.toFixed(1)}°C (${tempSrc.toUpperCase()})` },
                              ].map((info, i) => (
                                <div key={i} className="flex justify-between py-1 border-b border-[#1a1a3e]/50">
                                  <span className="text-[var(--color-muted)]">{info.label}</span>
                                  <span className="font-mono">{info.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="glass-card p-4 bg-[#0a0a1a]/50">
                            <h4 className="text-xs font-semibold text-[var(--color-muted)] mb-2">Ações Rápidas</h4>
                            <div className="flex flex-wrap gap-2">
                              {[20, 40, 60, 80, 100].map((pct) => (
                                <button key={pct} onClick={() => handleManualPwmChange(idx, pct, fan.name)}
                                  className={`px-3 py-1 rounded text-xs font-mono border transition-colors ${
                                    manualOverride[idx] && (manualPwm[idx] || 0) === pct
                                      ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/20'
                                      : 'border-[#1a1a3e] text-[var(--color-muted)] hover:border-[var(--color-primary)]'
                                  }`}>
                                  {pct}%
                                </button>
                              ))}
                              <button onClick={() => setExpandedFan(null)}
                                className="px-3 py-1 rounded text-xs border border-[#1a1a3e] text-[var(--color-muted)] hover:border-red-400 hover:text-red-400 transition-colors">
                                Fechar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {fans.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Fan className="w-12 h-12 mx-auto text-[var(--color-muted)] mb-4" />
          <p className="text-[var(--color-muted)] mb-2">Nenhuma ventoinha detectada</p>
          <p className="text-xs text-[var(--color-muted)]">O LibreHardwareMonitor pode precisar de permissões de administrador para detectar sensores de ventoinha.</p>
        </div>
      )}

      <AnimatePresence>
        {pendingChanges && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 glass-card px-6 py-3 border-[var(--color-primary)] shadow-xl shadow-[var(--color-primary)]/20">
            <span className="text-xs text-[var(--color-muted)]">Alterações pendentes</span>
            <button onClick={applyChanges}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: confirming ? '#22c55e' : 'linear-gradient(135deg, #00b4ff, #7c3aed)', color: '#fff' }}>
              {confirming ? (
                <><CheckCircle2 className="w-4 h-4" /> Aplicado!</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Aplicar</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
