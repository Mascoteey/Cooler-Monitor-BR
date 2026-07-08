import { contextBridge, ipcRenderer } from 'electron';

const api = {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  hide: () => ipcRenderer.send('window-hide'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: Record<string, unknown>) => ipcRenderer.invoke('update-settings', settings),
  getWindowState: () => ipcRenderer.invoke('get-window-state'),
  onHardwareData: (callback: (data: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on('hardware-data', listener);
    return () => ipcRenderer.removeListener('hardware-data', listener);
  },
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  onUpdateStatus: (callback: (data: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on('update-status', listener);
    return () => ipcRenderer.removeListener('update-status', listener);
  },

  // Overlay
  showOverlay: () => ipcRenderer.send('overlay-show'),
  hideOverlay: () => ipcRenderer.send('overlay-hide'),
  toggleOverlay: () => ipcRenderer.send('overlay-toggle'),
  updateOverlay: (config: unknown) => ipcRenderer.send('overlay-update', config),
  isOverlayVisible: () => ipcRenderer.invoke('overlay-visible'),

  // Fan control
  setFanSpeed: (fanName: string, pwm: number) => ipcRenderer.send('set-fan-speed', fanName, pwm),

  // Admin
  relaunchAsAdmin: () => ipcRenderer.invoke('relaunch-as-admin'),
};

contextBridge.exposeInMainWorld('electronAPI', api);
