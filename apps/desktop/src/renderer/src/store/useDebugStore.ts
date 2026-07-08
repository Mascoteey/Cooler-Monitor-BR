import { create } from 'zustand';

export type TestStatus = 'idle' | 'running' | 'pass' | 'fail' | 'warn';

export interface DebugLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
}

export interface TestResult {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  duration?: number;
  error?: string;
  details?: string;
}

export interface SystemStatus {
  dataSource: 'bridge' | 'simulated' | 'none';
  lastDataAge: number;
  bridgeProcess: 'running' | 'dead' | 'unknown';
  ipcChannel: 'ok' | 'error' | 'untested';
  storeHealthy: boolean;
  routerReady: boolean;
  fps: number;
  memoryMB: number;
  windowState: string;
}

interface DebugState {
  visible: boolean;
  activeTab: 'status' | 'tests' | 'store' | 'logs' | 'perf';
  logs: DebugLog[];
  testResults: TestResult[];
  systemStatus: SystemStatus;
  storeSnapshot: string;
  setVisible: (v: boolean) => void;
  toggle: () => void;
  setActiveTab: (tab: DebugState['activeTab']) => void;
  addLog: (entry: Omit<DebugLog, 'timestamp'>) => void;
  clearLogs: () => void;
  setTestResult: (result: TestResult) => void;
  updateSystemStatus: (patch: Partial<SystemStatus>) => void;
  setStoreSnapshot: (s: string) => void;
}

export const useDebugStore = create<DebugState>((set, get) => ({
  visible: false,
  activeTab: 'status',
  logs: [],
  testResults: [],
  systemStatus: {
    dataSource: 'none',
    lastDataAge: -1,
    bridgeProcess: 'unknown',
    ipcChannel: 'untested',
    storeHealthy: false,
    routerReady: false,
    fps: 0,
    memoryMB: 0,
    windowState: 'normal',
  },
  storeSnapshot: '{}',

  setVisible: (v) => set({ visible: v }),
  toggle: () => set((s) => ({ visible: !s.visible })),
  setActiveTab: (tab) => set({ activeTab: tab }),

  addLog: (entry) =>
    set((s) => ({
      logs: [{ ...entry, timestamp: Date.now() }, ...s.logs].slice(0, 500),
    })),

  clearLogs: () => set({ logs: [] }),

  setTestResult: (result) =>
    set((s) => {
      const existing = s.testResults.findIndex((t) => t.id === result.id);
      if (existing >= 0) {
        const updated = [...s.testResults];
        updated[existing] = result;
        return { testResults: updated };
      }
      return { testResults: [...s.testResults, result] };
    }),

  updateSystemStatus: (patch) =>
    set((s) => ({ systemStatus: { ...s.systemStatus, ...patch } })),

  setStoreSnapshot: (s) => set({ storeSnapshot: s }),
}));
