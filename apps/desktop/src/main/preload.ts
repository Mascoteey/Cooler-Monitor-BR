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
};

contextBridge.exposeInMainWorld('electronAPI', api);
