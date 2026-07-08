import { create } from 'zustand';
import { HardwareData, PageRoute, ThemeConfig } from '@cooler-monitor/shared';

interface AppState {
  // Navigation
  currentPage: PageRoute;
  setPage: (page: PageRoute) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Hardware data
  hardwareData: HardwareData | null;
  setHardwareData: (data: HardwareData) => void;

  // History
  history: Array<{ timestamp: number; cpuTemp: number; gpuTemp: number; cpuUsage: number; gpuUsage: number; ramUsage: number }>;
  addHistoryEntry: (entry: { timestamp: number; cpuTemp: number; gpuTemp: number; cpuUsage: number; gpuUsage: number; ramUsage: number }) => void;

  // Theme
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;

  // Alerts
  alerts: Array<{ id: string; message: string; type: 'warning' | 'critical' | 'info'; timestamp: number }>;
  addAlert: (alert: { message: string; type: 'warning' | 'critical' | 'info' }) => void;
  dismissAlert: (id: string) => void;

  // Settings
  settings: Record<string, unknown>;
  setSettings: (settings: Record<string, unknown>) => void;

  // Overlay
  overlayConfig: {
    enabled: boolean;
    opacity: number;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    showCpu: boolean;
    showGpu: boolean;
    showRam: boolean;
    showFans: boolean;
    showFps: boolean;
    showClock: boolean;
    showTemp: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
  setOverlayConfig: (config: Partial<{
    enabled: boolean;
    opacity: number;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    showCpu: boolean;
    showGpu: boolean;
    showRam: boolean;
    showFans: boolean;
    showFps: boolean;
    showClock: boolean;
    showTemp: boolean;
    fontSize: 'small' | 'medium' | 'large';
  }>) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentPage: 'dashboard',
  setPage: (page) => set({ currentPage: page }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  hardwareData: null,
  setHardwareData: (data) => {
    set({ hardwareData: data });
    const state = get();
    if (state.history.length > 1000) {
      set({ history: state.history.slice(-500) });
    }
    state.addHistoryEntry({
      timestamp: data.timestamp,
      cpuTemp: data.cpu.temperature.current,
      gpuTemp: data.gpu.temperature.current,
      cpuUsage: data.cpu.usage.current,
      gpuUsage: data.gpu.usage.current,
      ramUsage: data.ram.usage.current,
    });
  },

  history: [],
  addHistoryEntry: (entry) => set((s) => ({ history: [...s.history, entry] })),

  theme: {
    mode: 'dark',
    primary: '#00b4ff',
    secondary: '#7c3aed',
    background: '#0a0a1a',
    card: '#111122',
    text: '#e2e8f0',
    accent: '#00f5ff',
    glowColor: '#00b4ff',
  },
  setTheme: (theme) => set({ theme }),

  alerts: [],
  addAlert: (alert) =>
    set((s) => ({
      alerts: [{ ...alert, id: crypto.randomUUID(), timestamp: Date.now() }, ...s.alerts].slice(0, 50),
    })),
  dismissAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),

  settings: {},
  setSettings: (settings) => set({ settings }),

  overlayConfig: {
    enabled: false,
    opacity: 0.75,
    position: 'top-right',
    showCpu: true,
    showGpu: true,
    showRam: true,
    showFans: false,
    showFps: true,
    showClock: false,
    showTemp: true,
    fontSize: 'medium',
  },
  setOverlayConfig: (config) =>
    set((s) => ({ overlayConfig: { ...s.overlayConfig, ...config } })),
}));
