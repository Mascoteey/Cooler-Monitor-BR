import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, powerMonitor } from 'electron';
import { join, resolve } from 'path';
import { spawn, ChildProcess, exec } from 'child_process';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import log from 'electron-log';
import Store from 'electron-store';
import { autoUpdater } from 'electron-updater';
import { existsSync } from 'fs';
import { normalizeBridgeData } from './normalizeData';

const isDev = !app.isPackaged;
let isQuitting = false;
let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let hardwareProcess: ChildProcess | null = null;
let wss: WebSocketServer | null = null;

const store = new Store({
  defaults: {
    theme: 'dark',
    language: 'pt-BR',
    updateInterval: 1000,
    startMinimized: false,
    minimizeToTray: true,
    overlay: { enabled: false, opacity: 0.8, fps: false, cpu: true, gpu: true, ram: true, temp: true },
    alerts: [],
    profiles: [{ name: 'Balanced', settings: {} }],
  },
});

autoUpdater.logger = log;
autoUpdater.autoDownload = false;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#050510',
    show: false,
    icon: join(__dirname, '../../assets/icons/icon.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0a0a1a',
      symbolColor: '#00b4ff',
      height: 36,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      log.warn('Dev server not available, loading from dist');
      mainWindow?.loadFile(join(__dirname, '../../dist/index.html'));
    });
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (!isDev) autoUpdater.checkForUpdates();
  });

  mainWindow.on('close', () => {
    isQuitting = true;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createOverlayWindow(): void {
  overlayWindow = new BrowserWindow({
    width: 400,
    height: 300,
    transparent: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false,
    show: store.get('overlay.enabled') as boolean,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  if (isDev) {
    overlayWindow.loadURL('http://localhost:5173/#/overlay-display').catch(() => {
      overlayWindow?.loadFile(join(__dirname, '../../dist/index.html'), { hash: '/overlay-display' });
    });
  } else {
    overlayWindow.loadFile(join(__dirname, '../../dist/index.html'), { hash: '/overlay-display' });
  }

  overlayWindow.on('closed', () => { overlayWindow = null; });
}

function sendToOverlay(channel: string, data: unknown): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send(channel, data);
  }
}

function toggleOverlay(visible?: boolean): void {
  const show = visible ?? !overlayWindow?.isVisible();
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    if (show) createOverlayWindow();
    return;
  }
  if (show) overlayWindow.show();
  else overlayWindow.hide();
}

function createTray(): void {
  const iconPath = join(__dirname, '../../assets/icons/tray-icon.png');
  let trayIcon: Electron.NativeImage;
  if (existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    trayIcon = nativeImage.createEmpty();
  }
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
  tray.setToolTip('COOLER MONITOR BR');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir COOLER MONITOR BR',
      click: () => { mainWindow?.show(); mainWindow?.focus(); },
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => { isQuitting = true; app.quit(); },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

function startHardwareBridge(): void {
  let bridgePath: string;
  if (isDev) {
    bridgePath = resolve(__dirname, '../../../../hardware-bridge/CoolerHardwareBridge/bin/Release/net9.0/win-x64/publish/CoolerHardwareBridge.exe');
  } else {
    bridgePath = join(process.resourcesPath, 'hardware-bridge', 'CoolerHardwareBridge.exe');
  }

  if (!existsSync(bridgePath)) {
    log.warn('Hardware bridge not found at:', bridgePath);
    simulateHardwareData();
    return;
  }

  try {
    hardwareProcess = spawn(bridgePath, [], { stdio: ['pipe', 'pipe', 'pipe'] });

    hardwareProcess?.stderr?.on('data', (data: Buffer) => {
      log.info(`[BRIDGE] ${data.toString().trim()}`);
    });

    let buffer = '';
    let receivedAnyData = false;
    hardwareProcess?.stdout?.on('data', (data: Buffer) => {
      if (!receivedAnyData) {
        receivedAnyData = true;
        log.info('First bridge data received');
      }
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim()) {
          try {
            const sensorData = JSON.parse(line);
            const normalized = normalizeBridgeData(sensorData);
            mainWindow?.webContents.send('hardware-data', normalized);
            sendToOverlay('hardware-data', normalized);
            broadcastSensorData(normalized);
          } catch (e) {
            log.warn('Bridge JSON malformed:', line.trim().substring(0, 80));
          }
        }
      }
    });

    setTimeout(() => {
      if (!receivedAnyData) {
        log.warn('No bridge data in 5s, using simulated data');
        simulateHardwareData();
      }
    }, 5000);

    hardwareProcess?.on('error', (err) => {
      log.error('Hardware bridge error:', err);
      simulateHardwareData();
    });

    hardwareProcess?.on('exit', (code) => {
      log.info('Hardware bridge exited with code:', code);
      setTimeout(() => startHardwareBridge(), 2000);
    });
  } catch (err) {
    log.error('Failed to start hardware bridge:', err);
    simulateHardwareData();
  }
}

function simulateHardwareData(): void {
  log.info('Starting simulated hardware data for development');
  const getRandomSensorData = () => ({
    timestamp: Date.now(),
    cpu: {
      name: 'AMD Ryzen 9 7950X',
      temperature: { current: 45 + Math.random() * 30, min: 35, max: 95, avg: 55 },
      usage: { current: 5 + Math.random() * 25, min: 0, max: 100, avg: 15 },
      clock: { current: 4500 + Math.random() * 800, min: 2200, max: 5750, avg: 4200 },
      power: { current: 65 + Math.random() * 60, min: 15, max: 230, avg: 85 },
      voltage: { current: 1.25 + Math.random() * 0.1, min: 0.9, max: 1.5, avg: 1.2 },
      threads: 32, cores: 16, cache: '80MB',
      coreDetails: Array.from({ length: 16 }, (_, i) => ({
        core: i,
        temperature: 40 + Math.random() * 35,
        usage: Math.random() * 30,
        clock: 4300 + Math.random() * 800,
      })),
    },
    gpu: {
      name: 'NVIDIA GeForce RTX 4090',
      temperature: { current: 38 + Math.random() * 25, min: 30, max: 85, avg: 50 },
      hotspot: { current: 45 + Math.random() * 30, min: 35, max: 95, avg: 60 },
      usage: { current: 2 + Math.random() * 15, min: 0, max: 100, avg: 10 },
      clock: { current: 2520 + Math.random() * 200, min: 600, max: 2820, avg: 2400 },
      memory: { current: 4096 + Math.random() * 2048, min: 256, max: 24576, avg: 8192 },
      memoryClock: { current: 10501 + Math.random() * 500, min: 405, max: 11250, avg: 10000 },
      fan: { current: 800 + Math.random() * 400, min: 0, max: 3000, avg: 1200 },
      power: { current: 120 + Math.random() * 100, min: 15, max: 450, avg: 180 },
      voltage: { current: 1.05 + Math.random() * 0.05, min: 0.7, max: 1.1, avg: 1.0 },
      vram: { used: 4096 + Math.random() * 4096, total: 24576, usagePercent: 20 + Math.random() * 20 },
      pcie: { speed: 'Gen4 x16', width: 16 },
    },
    ram: {
      name: 'DDR5-6000',
      temperature: { current: 35 + Math.random() * 10, min: 30, max: 55, avg: 40 },
      usage: { current: 20 + Math.random() * 20, min: 10, max: 90, avg: 35 },
      used: 8192 + Math.random() * 8192,
      total: 32768,
      frequency: 6000,
      latency: 30 + Math.random() * 6,
      slots: [{ slot: 0, size: 16384, type: 'DDR5', frequency: 6000 }],
      channels: { dual: true, channel: 'Dual Channel' },
    },
    storage: [
      {
        name: 'Samsung 990 Pro 2TB',
        type: 'NVMe',
        temperature: { current: 35 + Math.random() * 15, min: 25, max: 70, avg: 40 },
        health: 100,
        lifeUsed: 0.3,
        readSpeed: 7450,
        writeSpeed: 6900,
        readBytes: 1024 ** 4 * 0.5,
        writeBytes: 1024 ** 4 * 0.3,
        used: 512e9,
        total: 2e12,
        usagePercent: 25 + Math.random() * 5,
      },
    ],
    motherboard: {
      name: 'ASUS ROG CROSSHAIR X670E HERO',
      chipset: { name: 'X670E', temperature: 35 + Math.random() * 15 },
      vrm: { temperature: 38 + Math.random() * 20 },
      pch: { temperature: 33 + Math.random() * 12 },
      ambient: { temperature: 25 + Math.random() * 5 },
    },
    fans: [
      { name: 'CPU Cooler', rpm: 1200 + Math.random() * 400, pwm: 45 + Math.random() * 20, speed: 65 + Math.random() * 15, mode: 'PWM' },
      { name: 'Case Front', rpm: 800 + Math.random() * 200, pwm: 35 + Math.random() * 15, speed: 50 + Math.random() * 10, mode: 'DC' },
      { name: 'Case Rear', rpm: 700 + Math.random() * 150, pwm: 30 + Math.random() * 10, speed: 40 + Math.random() * 10, mode: 'DC' },
    ],
    network: [
      {
        name: 'Ethernet',
        status: 'connected',
        speed: 1000,
        downloadSpeed: 25000000 + Math.random() * 50000000,
        uploadSpeed: 10000000 + Math.random() * 20000000,
        ip: '192.168.1.100',
        ping: 5 + Math.random() * 10,
      },
    ],
    sensors: [] as Array<{ name: string; value: number; unit: string; category: string; status: 'ok' | 'warning' | 'critical' }>,
  });

  const allSensors = [
    ...Array.from({ length: 30 }, (_, i) => ({
      name: `Sensor CPU #${i + 1}`,
      value: Math.random() * 100,
      unit: ['°C', '%', 'W', 'V', 'MHz', 'RPM'][Math.floor(Math.random() * 6)],
      category: 'CPU',
      status: Math.random() > 0.1 ? 'ok' as const : Math.random() > 0.5 ? 'warning' as const : 'critical' as const,
    })),
  ];

  setInterval(() => {
    const data = getRandomSensorData();
    data.sensors = allSensors.map((s) => ({ ...s, value: Math.random() * 100 }));
    mainWindow?.webContents.send('hardware-data', data);
    sendToOverlay('hardware-data', data);
    broadcastSensorData(data);
  }, store.get('updateInterval') as number);
}

function broadcastSensorData(data: unknown): void {
  if (!wss) return;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function startWebSocketServer(): void {
  const server = createServer();
  wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    log.info('WebSocket client connected');
    ws.send(JSON.stringify({ type: 'connected', message: 'COOLER MONITOR BR' }));
  });
  server.listen(0, () => {
    const port = (server.address() as { port: number }).port;
    store.set('wsPort', port);
    log.info(`WebSocket server on port ${port}`);
  });
}

ipcMain.handle('get-hardware-data', () => {
  return { message: 'real-time via IPC' };
});

ipcMain.handle('get-settings', () => {
  return store.store;
});

ipcMain.handle('update-settings', (_event, settings: Record<string, unknown>) => {
  for (const [key, value] of Object.entries(settings)) {
    store.set(key, value as never);
  }
  return { success: true };
});

ipcMain.handle('get-window-state', () => {
  if (!mainWindow) return { isMaximized: false, isMinimized: false };
  return {
    isMaximized: mainWindow.isMaximized(),
    isMinimized: mainWindow.isMinimized(),
  };
});

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
  const overlayEnabled = store.get('overlay.enabled') as boolean;
  if (overlayEnabled && overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.show();
  }
});
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());
ipcMain.on('window-hide', () => mainWindow?.hide());

ipcMain.on('overlay-show', () => toggleOverlay(true));
ipcMain.on('overlay-hide', () => toggleOverlay(false));
ipcMain.on('overlay-toggle', () => toggleOverlay());
ipcMain.on('overlay-update', (_event, config: unknown) => {
  store.set('overlay', config);
  sendToOverlay('overlay-config', config);
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    if ((config as any)?.enabled) overlayWindow.show();
    else overlayWindow.hide();
  }
});
ipcMain.handle('overlay-visible', () => {
  return overlayWindow?.isVisible() || false;
});

ipcMain.on('set-fan-speed', (_event, fanName: string, pwm: number) => {
  if (hardwareProcess && !hardwareProcess.killed && hardwareProcess.stdin) {
    const cmd = JSON.stringify({ fan: fanName, pwm }) + '\n';
    hardwareProcess.stdin.write(cmd);
    log.info(`Fan control sent: ${fanName} → ${pwm}%`);
  }
});

ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});

autoUpdater.on('checking-for-update', () => {
  mainWindow?.webContents.send('update-status', { status: 'checking' });
});

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-status', { status: 'available', info });
  autoUpdater.downloadUpdate();
});

autoUpdater.on('download-progress', (progress) => {
  mainWindow?.webContents.send('update-status', { status: 'downloading', progress });
});

autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update-status', { status: 'downloaded' });
});

app.whenReady().then(() => {
  log.info('COOLER MONITOR BR starting...');
  createWindow();
  createOverlayWindow();
  createTray();
  startWebSocketServer();
  startHardwareBridge();

  mainWindow?.on('restore', () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.hide();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

function cleanup(): void {
  isQuitting = true;

  if (hardwareProcess) {
    hardwareProcess.kill('SIGTERM');
    hardwareProcess = null;
  }

  if (wss) {
    wss.close();
    wss = null;
  }

  if (tray) {
    tray.destroy();
    tray = null;
  }
}

app.on('before-quit', () => {
  cleanup();
});

app.on('will-quit', () => {
  cleanup();
});

app.on('window-all-closed', () => {
  cleanup();
  app.quit();
});
