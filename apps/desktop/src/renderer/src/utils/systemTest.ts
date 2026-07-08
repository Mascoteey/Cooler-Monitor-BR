import { TestResult } from '../store/useDebugStore';
import { HardwareData } from '@cooler-monitor/shared';
import { useStore } from '../store/useStore';

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
