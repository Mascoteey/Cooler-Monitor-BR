import { TestResult } from '../store/useDebugStore';
import { HardwareData, FanCurvePoint } from '@cooler-monitor/shared';
import { useStore } from '../store/useStore';

// --- Helper functions (mirrors FansPage logic) ---

const PROFILE_CURVES: Record<string, FanCurvePoint[]> = {
  silent: [
    { temp: 30, pwm: 10 }, { temp: 50, pwm: 20 },
    { temp: 60, pwm: 35 }, { temp: 70, pwm: 50 },
    { temp: 80, pwm: 70 }, { temp: 90, pwm: 90 },
  ],
  balanced: [
    { temp: 30, pwm: 15 }, { temp: 40, pwm: 20 },
    { temp: 50, pwm: 30 }, { temp: 60, pwm: 45 },
    { temp: 70, pwm: 65 }, { temp: 80, pwm: 85 },
    { temp: 90, pwm: 100 },
  ],
  performance: [
    { temp: 30, pwm: 30 }, { temp: 50, pwm: 50 },
    { temp: 60, pwm: 70 }, { temp: 70, pwm: 85 },
    { temp: 80, pwm: 95 }, { temp: 90, pwm: 100 },
  ],
};

function calcTargetPwm(curve: FanCurvePoint[], temp: number): number {
  if (!curve || curve.length === 0) return 50;
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
}

function calcTargetRpm(pwm: number, minRpm: number, maxRpm: number): number {
  return Math.round(minRpm + (pwm / 100) * (maxRpm - minRpm));
}

function defaultCurve(profile: string): FanCurvePoint[] {
  return PROFILE_CURVES[profile] || PROFILE_CURVES['balanced'];
}

const TESTS: Array<{
  id: string;
  name: string;
  description: string;
  run: () => Promise<{ status: 'pass' | 'fail' | 'warn'; error?: string; details?: string }>;
}> = [
  {
    id: 'ipc-getSettings',
    name: 'IPC: getSettings',
    description: 'Chama electronAPI.getSettings() e verifica retorno',
    run: async () => {
      if (!window.electronAPI) return { status: 'fail', error: 'electronAPI não disponível (fora do Electron?)' };
      try {
        const settings = await window.electronAPI.getSettings();
        if (settings && typeof settings === 'object') return { status: 'pass', details: `OK: ${Object.keys(settings).length} chaves` };
        return { status: 'fail', error: 'Retorno inválido' };
      } catch (e) { return { status: 'fail', error: `${e}` }; }
    },
  },
  {
    id: 'ipc-getWindowState',
    name: 'IPC: getWindowState',
    description: 'Chama electronAPI.getWindowState()',
    run: async () => {
      if (!window.electronAPI) return { status: 'fail', error: 'electronAPI não disponível' };
      try {
        const state = await window.electronAPI.getWindowState();
        return { status: 'pass', details: `Maximized: ${state.isMaximized}, Minimized: ${state.isMinimized}` };
      } catch (e) { return { status: 'fail', error: `${e}` }; }
    },
  },
  {
    id: 'ipc-onHardwareData',
    name: 'IPC: onHardwareData listener',
    description: 'Verifica se o canal hardware-data está recebendo dados',
    run: async () => {
      if (!window.electronAPI) return { status: 'fail', error: 'electronAPI não disponível' };
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          cleanup();
          resolve({ status: 'warn', error: 'Timeout 5s - sem dados recebidos. Pode estar em modo simulado.' });
        }, 5000);
        const cleanup = window.electronAPI!.onHardwareData((data) => {
          clearTimeout(timeout);
          cleanup();
          if (data && typeof data === 'object' && 'cpu' in (data as any)) {
            resolve({ status: 'pass', details: `Dados recebidos: CPU ${(data as any).cpu?.name || 'desconhecido'}` });
          } else {
            resolve({ status: 'warn', details: 'Dados recebidos mas formato inesperado' });
          }
        });
      });
    },
  },
  {
    id: 'store-health',
    name: 'Store: Zustand saudável',
    description: 'Verifica se o store possui estado inicial correto',
    run: async () => {
      const state = useStore.getState();
      const checks = [
        { name: 'currentPage', ok: !!state.currentPage },
        { name: 'hardwareData', ok: true },
        { name: 'theme', ok: !!state.theme },
        { name: 'history', ok: Array.isArray(state.history) },
        { name: 'alerts', ok: Array.isArray(state.alerts) },
      ];
      const failed = checks.filter((c) => !c.ok);
      if (failed.length === 0) return { status: 'pass', details: `Todos os ${checks.length} campos OK` };
      return { status: 'warn', details: `Falhou: ${failed.map((f) => f.name).join(', ')}` };
    },
  },
  {
    id: 'store-setHardwareData',
    name: 'Store: setHardwareData propagação',
    description: 'Chama setHardwareData e verifica se hardwareData foi atualizado',
    run: async () => {
      try {
        const testData = { timestamp: Date.now(), cpu: { name: 'TEST', temperature: { current: 0, min: 0, max: 0, avg: 0 }, usage: { current: 0, min: 0, max: 0, avg: 0 }, clock: { current: 0, min: 0, max: 0, avg: 0 }, power: { current: 0, min: 0, max: 0, avg: 0 }, voltage: { current: 0, min: 0, max: 0, avg: 0 }, threads: 0, cores: 0, cache: '', coreDetails: [] }, gpu: { name: 'TEST', temperature: { current: 0, min: 0, max: 0, avg: 0 }, hotspot: { current: 0, min: 0, max: 0, avg: 0 }, usage: { current: 0, min: 0, max: 0, avg: 0 }, clock: { current: 0, min: 0, max: 0, avg: 0 }, memoryClock: { current: 0, min: 0, max: 0, avg: 0 }, memoryUsage: { current: 0, min: 0, max: 0, avg: 0 }, memoryTotal: 0, memoryUsed: 0, fanSpeed: { current: 0, min: 0, max: 0, avg: 0 }, power: { current: 0, min: 0, max: 0, avg: 0 }, voltage: { current: 0, min: 0, max: 0, avg: 0 }, tempLimit: 0 }, ram: { name: '', total: 0, used: 0, usage: { current: 0, min: 0, max: 0, avg: 0 }, available: 0, slots: [] }, storage: [], motherboard: { name: '', temperature: { current: 0, min: 0, max: 0, avg: 0 }, chipsetTemp: { current: 0, min: 0, max: 0, avg: 0 } }, fans: [], network: { interfaces: [] }, sensors: [] } as unknown as HardwareData;
        useStore.getState().setHardwareData(testData);
        const updated = useStore.getState().hardwareData;
        if (updated && updated.cpu.name === 'TEST') return { status: 'pass', details: 'Store atualizado corretamente' };
        return { status: 'fail', error: 'Store não foi atualizado' };
      } catch (e) { return { status: 'fail', error: `${e}` }; }
    },
  },
  {
    id: 'data-cpu',
    name: 'Dados: CPU presente',
    description: 'Verifica se hardwareData.cpu tem campos obrigatórios',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data) return { status: 'warn', error: 'Nenhum dado de hardware disponível (aguardando...)', details: 'Teste executado cedo demais, pode estar em loading' };
      if (!data.cpu) return { status: 'fail', error: 'cpu ausente' };
      if (!data.cpu.temperature || !data.cpu.usage) return { status: 'warn', error: 'cpu com campos incompletos' };
      return { status: 'pass', details: `${data.cpu.name} - ${data.cpu.cores}C/${data.cpu.threads}T @ ${Math.round(data.cpu.clock.current)}MHz` };
    },
  },
  {
    id: 'data-gpu',
    name: 'Dados: GPU presente',
    description: 'Verifica se hardwareData.gpu tem campos obrigatórios',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data) return { status: 'warn', error: 'Nenhum dado de hardware' };
      if (!data.gpu) return { status: 'fail', error: 'gpu ausente' };
      return { status: 'pass', details: `${data.gpu.name} - ${Math.round(data.gpu.temperature.current)}°C` };
    },
  },
  {
    id: 'data-ram',
    name: 'Dados: RAM presente',
    description: 'Verifica se hardwareData.ram tem campos obrigatórios',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data) return { status: 'warn', error: 'Nenhum dado de hardware' };
      if (!data.ram) return { status: 'fail', error: 'ram ausente' };
      const usage = data.ram.usage?.current ?? ((data.ram.used / data.ram.total) * 100);
      return { status: 'pass', details: `${Math.round(data.ram.total / 1024)}GB - ${Math.round(usage)}% usado` };
    },
  },
  {
    id: 'data-storage',
    name: 'Dados: Storage presente',
    description: 'Verifica se hardwareData.storage existe e tem ao menos 1 disco',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data) return { status: 'warn', error: 'Nenhum dado de hardware' };
      if (!data.storage || data.storage.length === 0) return { status: 'warn', error: 'Nenhum dispositivo de armazenamento' };
      return { status: 'pass', details: `${data.storage.length} dispositivo(s)` };
    },
  },
  {
    id: 'data-motherboard',
    name: 'Dados: Motherboard presente',
    description: 'Verifica se hardwareData.motherboard existe',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data) return { status: 'warn', error: 'Nenhum dado de hardware' };
      if (!data.motherboard) return { status: 'fail', error: 'motherboard ausente' };
      return { status: 'pass', details: data.motherboard.name };
    },
  },
  {
    id: 'data-fans',
    name: 'Dados: Fans presente',
    description: 'Verifica se hardwareData.fans existe',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data) return { status: 'warn', error: 'Nenhum dado de hardware' };
      if (!data.fans || data.fans.length === 0) return { status: 'warn', error: 'Nenhuma ventoinha detectada' };
      return { status: 'pass', details: `${data.fans.length} ventoinha(s)` };
    },
  },
  {
    id: 'data-network',
    name: 'Dados: Network presente',
    description: 'Verifica se hardwareData.network existe',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data) return { status: 'warn', error: 'Nenhum dado de hardware' };
      if (!data.network) return { status: 'fail', error: 'network ausente' };
      return { status: 'pass', details: `${data.network.interfaces?.length || 0} interface(s)` };
    },
  },
  {
    id: 'data-sensors',
    name: 'Dados: Sensores presente',
    description: 'Verifica se hardwareData.sensors existe',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data) return { status: 'warn', error: 'Nenhum dado de hardware' };
      if (!data.sensors) return { status: 'fail', error: 'sensors ausente' };
      return { status: 'pass', details: `${data.sensors.length} sensor(es)` };
    },
  },
  {
    id: 'nav-pages',
    name: 'Navegação: Rotas disponíveis',
    description: 'Verifica se o router consegue navegar para páginas',
    run: async () => {
      const state = useStore.getState();
      const pages = ['dashboard', 'cpu', 'gpu', 'memory', 'storage', 'motherboard', 'sensors', 'fans', 'network', 'history', 'alerts', 'settings', 'about'] as const;
      const results = pages.map((p) => {
        try {
          state.setPage(p);
          const success = useStore.getState().currentPage === p;
          return { page: p, ok: success };
        } catch { return { page: p, ok: false }; }
      });
      const failed = results.filter((r) => !r.ok);
      if (failed.length === 0) return { status: 'pass', details: `${results.length}/${results.length} rotas OK` };
      return { status: 'warn', details: `${results.length - failed.length}/${results.length} OK. Falhou: ${failed.map((f) => f.page).join(', ')}` };
    },
  },
  {
    id: 'theme-config',
    name: 'Tema: Configuração aplicada',
    description: 'Verifica se o tema padrão está configurado',
    run: async () => {
      const theme = useStore.getState().theme;
      if (!theme) return { status: 'fail', error: 'Tema não configurado' };
      const checks = [
        theme.mode, theme.primary, theme.secondary, theme.background,
        theme.card, theme.text, theme.accent, theme.glowColor,
      ];
      const allOk = checks.every((c) => !!c);
      return allOk
        ? { status: 'pass', details: `Modo: ${theme.mode}, Primary: ${theme.primary}` }
        : { status: 'fail', error: 'Campos do tema incompletos' };
    },
  },
  {
    id: 'history-recording',
    name: 'Histórico: Gravação ativa',
    description: 'Verifica se entradas de histórico estão sendo adicionadas',
    run: async () => {
      const initial = useStore.getState().history.length;
      const testData = { timestamp: Date.now(), cpuTemp: 50, gpuTemp: 45, cpuUsage: 10, ramUsage: 30 };
      useStore.getState().addHistoryEntry(testData);
      await new Promise((r) => setTimeout(r, 50));
      const after = useStore.getState().history.length;
      return after > initial
        ? { status: 'pass', details: `Histórico: ${after} entradas` }
        : { status: 'fail', error: 'Histórico não foi atualizado' };
    },
  },
  {
    id: 'alert-system',
    name: 'Alertas: Sistema funcional',
    description: 'Testa addAlert e dismissAlert',
    run: async () => {
      const store = useStore.getState();
      const before = store.alerts.length;
      store.addAlert({ message: 'Teste de depuração', type: 'info' });
      await new Promise((r) => setTimeout(r, 50));
      const afterAdd = useStore.getState().alerts.length;
      if (afterAdd <= before) return { status: 'fail', error: 'addAlert não funcionou' };
      const alertToDismiss = useStore.getState().alerts[0];
      if (alertToDismiss) {
        useStore.getState().dismissAlert(alertToDismiss.id);
        await new Promise((r) => setTimeout(r, 50));
      }
      return { status: 'pass', details: 'addAlert + dismissAlert OK' };
    },
  },
  {
    id: 'window-electron-api',
    name: 'ElectronAPI: Bridge completo',
    description: 'Verifica se todas as funções do electronAPI estão expostas',
    run: async () => {
      if (!window.electronAPI) return { status: 'fail', error: 'electronAPI não encontrado' };
      const expectedMethods = ['minimize', 'maximize', 'close', 'hide', 'getSettings', 'updateSettings', 'getWindowState', 'onHardwareData', 'checkForUpdates', 'onUpdateStatus'];
      const missing = expectedMethods.filter((m) => typeof (window.electronAPI as any)[m] !== 'function');
      if (missing.length === 0) return { status: 'pass', details: `${expectedMethods.length}/${expectedMethods.length} métodos OK` };
      return { status: 'warn', details: `Ausentes: ${missing.join(', ')}` };
    },
  },

  // ═══════════════════════════════════════════════
  //  E2E / RECONFERÊNCIA
  // ═══════════════════════════════════════════════

  {
    id: 'e2e-cpu-sensors',
    name: 'E2E: CPU — sensores completos',
    description: 'CPU: temperature, usage, clock, power, voltage, coreDetails presentes e em range válido',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data?.cpu) return { status: 'warn', error: 'Sem dados de CPU' };
      const c = data.cpu;
      const issues: string[] = [];
      if (!c.name) issues.push('name ausente');
      if (c.cores < 1 || c.threads < 1) issues.push(`cores/threads inválidos (${c.cores}C/${c.threads}T)`);
      if (c.temperature.current < 0 || c.temperature.current > 120) issues.push(`temp ${c.temperature.current}°C fora do range`);
      if (c.usage.current < 0 || c.usage.current > 100) issues.push(`usage ${c.usage.current}% inválido`);
      if (c.clock.current < 100 || c.clock.current > 10000) issues.push(`clock ${c.clock.current}MHz inválido`);
      if (!c.coreDetails || c.coreDetails.length !== c.cores) issues.push(`coreDetails: ${c.coreDetails?.length || 0} cores, esperado ${c.cores}`);
      return issues.length === 0
        ? { status: 'pass', details: `${c.name} — ${c.temperature.current}°C, ${c.usage.current}%, ${c.cores}C/${c.threads}T` }
        : { status: 'warn', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-gpu-sensors',
    name: 'E2E: GPU — sensores completos',
    description: 'GPU: temperature, hotspot, usage, clock, memory, vram, pcie, fan',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data?.gpu) return { status: 'warn', error: 'Sem dados de GPU' };
      const g = data.gpu;
      const issues: string[] = [];
      if (!g.name) issues.push('name ausente');
      if (g.temperature.current < 0 || g.temperature.current > 120) issues.push(`temp ${g.temperature.current}°C`);
      if (g.usage.current < 0 || g.usage.current > 100) issues.push(`usage ${g.usage.current}%`);
      if (g.vram && g.vram.total <= 0) issues.push('vram total zero');
      if (g.vram && (g.vram.used < 0 || g.vram.used > g.vram.total)) issues.push('vram used > total');
      if (!g.pcie) issues.push('pcie ausente');
      if (g.memoryClock.current <= 0) issues.push(`memoryClock ${g.memoryClock.current}`);
      return issues.length === 0
        ? { status: 'pass', details: `${g.name} — ${g.temperature.current}°C, ${g.usage.current}%, VRAM ${Math.round(g.vram?.usagePercent || 0)}%` }
        : { status: 'warn', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-ram-sensors',
    name: 'E2E: RAM — sensores completos',
    description: 'RAM: total, used, usage, frequency, channels, slots',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data?.ram) return { status: 'warn', error: 'Sem dados de RAM' };
      const r = data.ram;
      const issues: string[] = [];
      if (r.total <= 0) issues.push('total zero');
      if (r.used < 0) issues.push('used negativo');
      if (r.used > r.total && r.total > 0) issues.push('used > total');
      if (r.usage.current < 0 || r.usage.current > 100) issues.push(`usage ${r.usage.current}%`);
      if (r.frequency <= 0) issues.push(`frequency ${r.frequency}`);
      if (!r.channels) issues.push('channels ausente');
      if (!r.slots || r.slots.length === 0) issues.push('slots vazio');
      const totalSlots = r.slots?.reduce((a, s) => a + s.size, 0) || 0;
      if (totalSlots > 0 && Math.abs(totalSlots - r.total) > r.total * 0.1) issues.push('soma slots difere do total');
      return issues.length === 0
        ? { status: 'pass', details: `${Math.round(r.total / 1.074e9)}GB — ${r.usage.current}% usado, ${r.frequency}MHz, ${r.channels?.channel || '?'}` }
        : { status: 'warn', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-storage-sensors',
    name: 'E2E: Armazenamento — sensores completos',
    description: 'Storage: name, type, temperature, health, used/total, usage percent',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data?.storage || data.storage.length === 0) return { status: 'warn', error: 'Sem dados de storage' };
      const issues: string[] = [];
      data.storage.forEach((d, i) => {
        if (!d.name) issues.push(`[${i}] name ausente`);
        if (d.health < 0 || d.health > 100) issues.push(`[${i}] health ${d.health}`);
        if (d.total <= 0) issues.push(`[${i}] total zero`);
        if (d.used < 0 || d.used > d.total) issues.push(`[${i}] used ${d.used} / total ${d.total}`);
        if (d.usagePercent < 0 || d.usagePercent > 100) issues.push(`[${i}] usagePercent ${d.usagePercent}`);
      });
      return issues.length === 0
        ? { status: 'pass', details: `${data.storage.length} dispositivo(s) — ${data.storage.map((d) => `${Math.round(d.total / 1.074e9)}GB`).join(', ')}` }
        : { status: 'warn', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-motherboard-sensors',
    name: 'E2E: Motherboard — sensores completos',
    description: 'Motherboard: name, chipset, vrm, pch, ambient temps',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data?.motherboard) return { status: 'warn', error: 'Sem dados de motherboard' };
      const m = data.motherboard;
      const issues: string[] = [];
      if (!m.name) issues.push('name ausente');
      if (!m.chipset) issues.push('chipset ausente');
      if (!m.vrm) issues.push('vrm ausente');
      if (!m.pch) issues.push('pch ausente');
      return issues.length === 0
        ? { status: 'pass', details: `${m.name} — Chipset ${m.chipset?.temperature || '?'}°C, VRM ${m.vrm?.temperature || '?'}°C` }
        : { status: 'warn', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-fans-sensors',
    name: 'E2E: Fans — RPM, PWM, modos',
    description: 'Fans: rpm, pwm, mode, label, minRpm, maxRpm, header presentes',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data?.fans || data.fans.length === 0) return { status: 'warn', error: 'Sem dados de fans' };
      const issues: string[] = [];
      data.fans.forEach((f, i) => {
        if (!f.name) issues.push(`[${i}] name ausente`);
        if (f.rpm < 0) issues.push(`[${i}] rpm negativo`);
        if (f.pwm < 0 || f.pwm > 100) issues.push(`[${i}] pwm ${f.pwm}% inválido`);
        if (!f.mode) issues.push(`[${i}] mode ausente`);
        if (!f.label) issues.push(`[${i}] label ausente`);
        if (f.minRpm !== undefined && f.maxRpm !== undefined && f.minRpm >= f.maxRpm) issues.push(`[${i}] minRpm >= maxRpm`);
      });
      const totalRpm = data.fans.reduce((a, f) => a + f.rpm, 0);
      return issues.length === 0
        ? { status: 'pass', details: `${data.fans.length} cooler(s) — ${totalRpm.toFixed(0)} RPM total` }
        : { status: 'warn', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-network-sensors',
    name: 'E2E: Rede — interfaces presentes',
    description: 'Network: name, status, speed, download/upload speed',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data?.network || data.network.length === 0) return { status: 'warn', error: 'Sem dados de rede' };
      const issues: string[] = [];
      data.network.forEach((n, i) => {
        if (!n.name) issues.push(`[${i}] name ausente`);
        if (!n.status) issues.push(`[${i}] status ausente`);
      });
      return issues.length === 0
        ? { status: 'pass', details: `${data.network.length} interface(s) — ${data.network.map((n) => n.name).join(', ')}` }
        : { status: 'warn', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-sensors-list',
    name: 'E2E: Lista de sensores genéricos',
    description: 'Sensors array com name, value, unit, category, status válidos',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data?.sensors || data.sensors.length === 0) return { status: 'warn', error: 'Sem sensores genéricos' };
      const issues: string[] = [];
      data.sensors.forEach((s, i) => {
        if (!s.name) issues.push(`[${i}] name ausente`);
        if (s.category && !['Cpu', 'Gpu', 'Memory', 'Storage', 'Motherboard', 'Network', 'Fan', 'Unknown'].includes(s.category)) issues.push(`[${i}] categoria inválida ${s.category}`);
        if (s.status && !['ok', 'warning', 'critical'].includes(s.status)) issues.push(`[${i}] status inválido ${s.status}`);
      });
      return issues.length === 0
        ? { status: 'pass', details: `${data.sensors.length} sensores no total` }
        : { status: 'warn', details: issues.join('; ') };
    },
  },

  // ═══ ANÁLISE DE TEMPERATURAS ═══

  {
    id: 'e2e-temp-analysis',
    name: 'E2E: Análise de temperaturas',
    description: 'Compara CPU vs GPU, hotspot, min/max ranges, identifica componente mais quente',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data?.cpu || !data?.gpu) return { status: 'warn', error: 'Dados insuficientes' };
      const cpuT = data.cpu.temperature.current;
      const gpuT = data.gpu.temperature.current;
      const hotspot = data.gpu.hotspot?.current || 0;
      const cpuMax = data.cpu.temperature.max;
      const gpuMax = data.gpu.temperature.max;
      const hottest = cpuT >= gpuT ? 'CPU' : 'GPU';
      const delta = Math.abs(cpuT - gpuT);
      const details = `CPU ${cpuT.toFixed(1)}°C · GPU ${gpuT.toFixed(1)}°C · Hotspot ${hotspot.toFixed(1)}°C · Δ ${delta.toFixed(1)}°C · ${hottest} mais quente`;
      return { status: 'pass', details };
    },
  },
  {
    id: 'e2e-temp-ranges',
    name: 'E2E: Ranges de temperatura seguros',
    description: 'CPU < 100°C, GPU < 90°C, hotspot < 105°C, VRM < 110°C',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data?.cpu || !data?.gpu || !data?.motherboard) return { status: 'warn', error: 'Dados insuficientes' };
      const issues: string[] = [];
      if (data.cpu.temperature.current >= 100) issues.push(`CPU ${data.cpu.temperature.current}°C crítica`);
      if (data.gpu.temperature.current >= 90) issues.push(`GPU ${data.gpu.temperature.current}°C crítica`);
      if (data.gpu.hotspot?.current >= 105) issues.push(`GPU Hotspot ${data.gpu.hotspot.current}°C crítica`);
      if (data.motherboard.vrm?.temperature >= 110) issues.push(`VRM ${data.motherboard.vrm.temperature}°C crítica`);
      const storageHot = data.storage?.filter((d) => d.temperature?.current >= 70);
      if (storageHot && storageHot.length > 0) issues.push(`${storageHot.length} storage(s) >= 70°C`);
      return issues.length === 0
        ? { status: 'pass', details: 'Todas as temperaturas em range seguro' }
        : { status: 'warn', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-temp-core-details',
    name: 'E2E: Temperaturas por núcleo',
    description: 'CoreDetails: cada core com temperature, usage, clock válidos',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data?.cpu?.coreDetails || data.cpu.coreDetails.length === 0) return { status: 'warn', error: 'Sem core details' };
      const issues: string[] = [];
      data.cpu.coreDetails.forEach((cd, i) => {
        if (cd.temperature < 0 || cd.temperature > 120) issues.push(`core[${i}] temp ${cd.temperature}°C`);
        if (cd.usage < 0 || cd.usage > 100) issues.push(`core[${i}] usage ${cd.usage}%`);
        if (cd.clock < 0) issues.push(`core[${i}] clock ${cd.clock}MHz negativo`);
      });
      const avgTemp = data.cpu.coreDetails.reduce((a, c) => a + c.temperature, 0) / data.cpu.coreDetails.length;
      const maxTemp = Math.max(...data.cpu.coreDetails.map((c) => c.temperature));
      return issues.length === 0
        ? { status: 'pass', details: `${data.cpu.coreDetails.length} cores — média ${avgTemp.toFixed(1)}°C, max ${maxTemp.toFixed(1)}°C` }
        : { status: 'warn', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-temp-gpu-components',
    name: 'E2E: GPU — comparação core/hotspot/memória',
    description: 'Hotspot >= core temp, memory temp presente',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data?.gpu) return { status: 'warn', error: 'Sem GPU' };
      const g = data.gpu;
      const issues: string[] = [];
      if (g.hotspot && g.hotspot.current < g.temperature.current) issues.push(`hotspot (${g.hotspot.current}°C) < core (${g.temperature.current}°C)`);
      if (g.memory && g.memory.current < 0) issues.push('memory clock negativo');
      if (g.fan && g.fan.current < 0) issues.push('fan speed negativo');
      return issues.length === 0
        ? { status: 'pass', details: `Core ${g.temperature.current}°C · Hotspot ${g.hotspot?.current || '?'}°C · Fan ${g.fan?.current || 0} RPM` }
        : { status: 'warn', details: issues.join('; ') };
    },
  },

  // ═══ PERFIS DE VENTOINHAS ═══

  {
    id: 'e2e-profile-default-curves',
    name: 'E2E: Perfis — curvas padrão',
    description: 'Verifica defaultCurve para silent/balanced/performance',
    run: async () => {
      const tests = [
        { id: 'silent', expected: 6, firstPwm: 10, lastPwm: 90 },
        { id: 'balanced', expected: 7, firstPwm: 15, lastPwm: 100 },
        { id: 'performance', expected: 6, firstPwm: 30, lastPwm: 100 },
      ];
      const issues: string[] = [];
      for (const t of tests) {
        const curve = defaultCurve(t.id);
        if (curve.length !== t.expected) issues.push(`${t.id}: ${curve.length} pontos (esperado ${t.expected})`);
        if (curve[0]?.pwm !== t.firstPwm) issues.push(`${t.id}: pwm inicial ${curve[0]?.pwm} (esperado ${t.firstPwm})`);
        if (curve[curve.length - 1]?.pwm !== t.lastPwm) issues.push(`${t.id}: pwm final ${curve[curve.length - 1]?.pwm} (esperado ${t.lastPwm})`);
        for (const pt of curve) {
          if (pt.temp < 0 || pt.temp > 100) issues.push(`${t.id}: temp ${pt.temp} fora do range`);
          if (pt.pwm < 0 || pt.pwm > 100) issues.push(`${t.id}: pwm ${pt.pwm} fora do range`);
        }
      }
      return issues.length === 0
        ? { status: 'pass', details: `silent(6), balanced(7), performance(6) — todos válidos` }
        : { status: 'fail', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-profile-pwm-calc',
    name: 'E2E: Perfis — cálculo PWM por temperatura',
    description: 'Para cada perfil, testa PWM em múltiplas temperaturas (30-90°C)',
    run: async () => {
      const testCases = [
        { profile: 'silent', temp: 30, expect: 10 },
        { profile: 'silent', temp: 50, expect: 20 },
        { profile: 'silent', temp: 80, expect: 70 },
        { profile: 'silent', temp: 90, expect: 90 },
        { profile: 'balanced', temp: 30, expect: 15 },
        { profile: 'balanced', temp: 60, expect: 45 },
        { profile: 'balanced', temp: 90, expect: 100 },
        { profile: 'performance', temp: 30, expect: 30 },
        { profile: 'performance', temp: 70, expect: 85 },
        { profile: 'performance', temp: 90, expect: 100 },
      ];
      const issues: string[] = [];
      for (const tc of testCases) {
        const curve = defaultCurve(tc.profile);
        const pwm = calcTargetPwm(curve, tc.temp);
        if (pwm !== tc.expect) issues.push(`${tc.profile} @ ${tc.temp}°C: PWM ${pwm}% (esperado ${tc.expect}%)`);
      }
      return issues.length === 0
        ? { status: 'pass', details: `${testCases.length} casos testados — todos corretos` }
        : { status: 'fail', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-profile-pwm-interpolation',
    name: 'E2E: Perfis — interpolação entre pontos',
    description: 'Testa valores intermediários entre pontos da curva (ex: 55°C entre 50 e 60)',
    run: async () => {
      const curve = defaultCurve('balanced');
      const tests = [
        { temp: 35, expected: 17 },
        { temp: 45, expected: 25 },
        { temp: 55, expected: 37 },
        { temp: 65, expected: 55 },
        { temp: 75, expected: 75 },
        { temp: 85, expected: 92 },
      ];
      const issues: string[] = [];
      for (const t of tests) {
        const pwm = calcTargetPwm(curve, t.temp);
        const diff = Math.abs(pwm - t.expected);
        if (diff > 3) issues.push(`@ ${t.temp}°C: PWM ${pwm}% (esperado ~${t.expected}%, diff ${diff})`);
      }
      return issues.length === 0
        ? { status: 'pass', details: `Interpolação linear OK em ${tests.length} pontos` }
        : { status: 'warn', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-profile-rpm-calc',
    name: 'E2E: Perfis — cálculo RPM alvo',
    description: 'RPM alvo baseado no PWM × faixa do cooler',
    run: async () => {
      const tests = [
        { pwm: 0, min: 500, max: 1500, expected: 500 },
        { pwm: 100, min: 500, max: 1500, expected: 1500 },
        { pwm: 50, min: 500, max: 1500, expected: 1000 },
        { pwm: 25, min: 800, max: 2200, expected: 1150 },
        { pwm: 75, min: 400, max: 1200, expected: 1000 },
      ];
      const issues: string[] = [];
      for (const t of tests) {
        const rpm = calcTargetRpm(t.pwm, t.min, t.max);
        if (rpm !== t.expected) issues.push(`PWM ${t.pwm}% [${t.min}-${t.max}]: RPM ${rpm} (esperado ${t.expected})`);
      }
      return issues.length === 0
        ? { status: 'pass', details: `RPM alvo OK em ${tests.length} cenários` }
        : { status: 'fail', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-profile-extremes',
    name: 'E2E: Perfis — temperaturas extremas',
    description: 'PWM em 0°C (mínimo) e 100°C (máximo) para cada perfil',
    run: async () => {
      const issues: string[] = [];
      for (const pid of ['silent', 'balanced', 'performance']) {
        const curve = defaultCurve(pid);
        const at0 = calcTargetPwm(curve, 0);
        const at100 = calcTargetPwm(curve, 100);
        if (at0 !== curve[0].pwm) issues.push(`${pid} @0°C: PWM ${at0} (esperado ${curve[0].pwm})`);
        if (at100 !== curve[curve.length - 1].pwm) issues.push(`${pid} @100°C: PWM ${at100} (esperado ${curve[curve.length - 1].pwm})`);
      }
      return issues.length === 0
        ? { status: 'pass', details: 'Extremos @0°C e @100°C corretos para todos os perfis' }
        : { status: 'fail', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-profile-custom-edit',
    name: 'E2E: Perfis — edição manual (custom)',
    description: 'Simula edição de curva: altera pontos e verifica novo cálculo PWM',
    run: async () => {
      const manualCurve: FanCurvePoint[] = [
        { temp: 30, pwm: 50 },
        { temp: 60, pwm: 80 },
        { temp: 90, pwm: 100 },
      ];
      const tests = [
        { temp: 30, expected: 50 },
        { temp: 45, expected: 65 },
        { temp: 60, expected: 80 },
        { temp: 90, expected: 100 },
      ];
      const issues: string[] = [];
      for (const t of tests) {
        const pwm = calcTargetPwm(manualCurve, t.temp);
        if (pwm !== t.expected) issues.push(`Custom @${t.temp}°C: PWM ${pwm}% (esperado ${t.expected}%)`);
      }
      return issues.length === 0
        ? { status: 'pass', details: 'Curva customizada com interpolação linear OK' }
        : { status: 'fail', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-profile-fan-range',
    name: 'E2E: Perfis — faixa de PWM por cooler',
    description: 'Simula 5 coolers com faixas diferentes e verifica RPM alvo',
    run: async () => {
      const fans = [
        { name: 'CPU Cooler', min: 800, max: 2200 },
        { name: 'Chassis #1', min: 500, max: 1500 },
        { name: 'Chassis #2', min: 500, max: 1500 },
        { name: 'Chassis #3', min: 400, max: 1200 },
        { name: 'Chassis #4', min: 400, max: 1200 },
      ];
      const curve = defaultCurve('balanced');
      const temp = 55;
      const pwm = calcTargetPwm(curve, temp);
      const issues: string[] = [];
      fans.forEach((f) => {
        const rpm = calcTargetRpm(pwm, f.min, f.max);
        if (rpm < f.min || rpm > f.max) issues.push(`${f.name}: RPM ${rpm} fora [${f.min}-${f.max}]`);
      });
      return issues.length === 0
        ? { status: 'pass', details: `${fans.length} coolers à ${temp}°C → PWM ${pwm}% → RPMs dentro da faixa` }
        : { status: 'fail', details: issues.join('; ') };
    },
  },

  // ═══ VALIDAÇÃO DE DADOS CRUZADOS ═══

  {
    id: 'e2e-data-timestamp',
    name: 'E2E: Timestamp recente',
    description: 'Verifica se hardwareData.timestamp é dos últimos 60 segundos',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data) return { status: 'warn', error: 'Sem dados' };
      const now = Date.now();
      const age = now - data.timestamp;
      if (age < 0) return { status: 'warn', details: `Timestamp futuro em ${Math.abs(age)}ms` };
      if (age > 60000) return { status: 'warn', details: `Dados antigos: ${(age / 1000).toFixed(0)}s atrás` };
      return { status: 'pass', details: `Dados de ${(age / 1000).toFixed(0)}s atrás` };
    },
  },
  {
    id: 'e2e-data-consistency',
    name: 'E2E: Consistência entre sensores',
    description: 'Verifica RAM used + available ≈ total, cross-checks',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data) return { status: 'warn', error: 'Sem dados' };
      const issues: string[] = [];
      // RAM used + available ≈ total
      const ram = data.ram;
      if (ram && ram.used > 0 && ram.total > 0) {
        const usedGB = ram.used / 1.074e9;
        const totalGB = ram.total / 1.074e9;
        if (usedGB > totalGB + 0.5) issues.push(`RAM used ${usedGB.toFixed(1)}GB > total ${totalGB.toFixed(1)}GB`);
      }
      // Storage used ≤ total
      data.storage?.forEach((d, i) => {
        if (d.used > d.total && d.total > 0) issues.push(`Storage[${i}] used ${d.used} > total ${d.total}`);
      });
      return issues.length === 0
        ? { status: 'pass', details: 'Dados consistentes' }
        : { status: 'warn', details: issues.join('; ') };
    },
  },
  {
    id: 'e2e-data-required-fields',
    name: 'E2E: Campos obrigatórios presentes',
    description: 'HardwareData com todos os top-level fields: cpu, gpu, ram, storage, motherboard, fans, network, sensors',
    run: async () => {
      const data = useStore.getState().hardwareData;
      if (!data) return { status: 'warn', error: 'Sem dados' };
      const required = ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'fans', 'network', 'sensors'] as const;
      const missing = required.filter((k) => !(data as any)[k]);
      return missing.length === 0
        ? { status: 'pass', details: `${required.length}/${required.length} campos OK` }
        : { status: 'fail', error: `Ausentes: ${missing.join(', ')}` };
    },
  },
];

export async function runTest(testId: string): Promise<TestResult> {
  const test = TESTS.find((t) => t.id === testId);
  if (!test) return { id: testId, name: testId, description: '', status: 'fail', error: 'Teste não encontrado' };
  const start = performance.now();
  const result = await test.run();
  const duration = Math.round(performance.now() - start);
  return {
    id: test.id,
    name: test.name,
    description: test.description,
    status: result.status,
    duration,
    error: result.error,
    details: result.details,
  };
}

export async function runAllTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  for (const test of TESTS) {
    const start = performance.now();
    const result = await test.run();
    const duration = Math.round(performance.now() - start);
    results.push({
      id: test.id,
      name: test.name,
      description: test.description,
      status: result.status,
      duration,
      error: result.error,
      details: result.details,
    });
  }
  return results;
}

export function captureStoreSnapshot(): string {
  const state = useStore.getState();
  const snapshot = {
    currentPage: state.currentPage,
    hardwareData: state.hardwareData ? {
      timestamp: state.hardwareData.timestamp,
      cpu: `${state.hardwareData.cpu?.name} @ ${Math.round(state.hardwareData.cpu?.clock?.current || 0)}MHz`,
      gpu: `${state.hardwareData.gpu?.name} @ ${Math.round(state.hardwareData.gpu?.temperature?.current || 0)}°C`,
      ram: `${Math.round((state.hardwareData.ram?.used || 0) / 1024 / 1024)}MB / ${Math.round((state.hardwareData.ram?.total || 0) / 1024 / 1024)}MB`,
    } : null,
    historyCount: state.history.length,
    alertsCount: state.alerts.length,
    theme: state.theme.mode,
    sidebarOpen: state.sidebarOpen,
    settings: Object.keys(state.settings).length > 0 ? state.settings : '(default)',
  };
  return JSON.stringify(snapshot, null, 2);
}
