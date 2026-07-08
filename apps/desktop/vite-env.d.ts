/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    hide: () => void;
    getSettings: () => Promise<Record<string, unknown>>;
    updateSettings: (settings: Record<string, unknown>) => Promise<{ success: boolean }>;
    getWindowState: () => Promise<{ isMaximized: boolean; isMinimized: boolean }>;
    onHardwareData: (callback: (data: unknown) => void) => () => void;
    checkForUpdates: () => void;
    onUpdateStatus: (callback: (data: unknown) => void) => () => void;
  };
}
