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
    showOverlay: () => void;
    hideOverlay: () => void;
    toggleOverlay: () => void;
    updateOverlay: (config: unknown) => void;
    isOverlayVisible: () => Promise<boolean>;
    setFanSpeed: (fanName: string, pwm: number) => void;
    relaunchAsAdmin: () => Promise<{ success: boolean; error?: string }>;
  };
}
