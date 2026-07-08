import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import CpuPage from './pages/CpuPage';
import GpuPage from './pages/GpuPage';
import MemoryPage from './pages/MemoryPage';
import StoragePage from './pages/StoragePage';
import MotherboardPage from './pages/MotherboardPage';
import SensorsPage from './pages/SensorsPage';
import FansPage from './pages/FansPage';
import NetworkPage from './pages/NetworkPage';
import HistoryPage from './pages/HistoryPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';
import OverlayConfig from './pages/OverlayConfig';
import OverlayDisplay from './pages/OverlayDisplay';
import DebugPanel from './components/debug/DebugPanel';
import { useStore } from './store/useStore';
import { useDebugStore } from './store/useDebugStore';
import { useHardwareData } from './hooks/useHardwareData';

export default function App() {
  const theme = useStore((s) => s.theme);
  const toggleDebug = useDebugStore((s) => s.toggle);
  const addLog = useDebugStore((s) => s.addLog);
  const updateSystemStatus = useDebugStore((s) => s.updateSystemStatus);
  useHardwareData();

  useEffect(() => {
    updateSystemStatus({ storeHealthy: true, routerReady: true });
  }, []);

  useEffect(() => {
    addLog({ level: 'info', message: `App montado. Tema: ${theme.mode}`, source: 'app' });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleDebug();
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        window.electronAPI?.toggleOverlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDebug]);

  useEffect(() => {
    const origError = console.error;
    const origWarn = console.warn;
    const origLog = console.log;
    console.error = (...args) => { origError.apply(console, args); addLog({ level: 'error', message: args.map((a) => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), source: 'console' }); };
    console.warn = (...args) => { origWarn.apply(console, args); addLog({ level: 'warn', message: args.map((a) => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), source: 'console' }); };
    console.log = (...args) => { origLog.apply(console, args); addLog({ level: 'debug', message: args.map((a) => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), source: 'console' }); };
    window.addEventListener('error', (e) => addLog({ level: 'error', message: `Uncaught: ${e.message}`, source: 'window' }));
    window.addEventListener('unhandledrejection', (e) => addLog({ level: 'error', message: `Promise: ${e.reason}`, source: 'window' }));
    return () => {
      console.error = origError;
      console.warn = origWarn;
      console.log = origLog;
    };
  }, []);

  const themeColors = {
    '--color-primary': theme.primary,
    '--color-secondary': theme.secondary,
    '--color-background': theme.background,
    '--color-card': theme.card,
    '--color-text': theme.text,
    '--color-accent': theme.accent,
  } as React.CSSProperties;

  return (
    <div style={themeColors} className="h-full w-full overflow-hidden bg-[var(--color-background)]">
      <HashRouter>
        <Routes>
          <Route path="/overlay-display" element={<OverlayDisplay />} />
          <Route path="*" element={
            <Layout>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/cpu" element={<CpuPage />} />
                  <Route path="/gpu" element={<GpuPage />} />
                  <Route path="/memory" element={<MemoryPage />} />
                  <Route path="/storage" element={<StoragePage />} />
                  <Route path="/motherboard" element={<MotherboardPage />} />
                  <Route path="/sensors" element={<SensorsPage />} />
                  <Route path="/fans" element={<FansPage />} />
                  <Route path="/network" element={<NetworkPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/overlay" element={<OverlayConfig />} />
                </Routes>
              </AnimatePresence>
            </Layout>
          } />
        </Routes>
        </HashRouter>
        <DebugPanel />
    </div>
  );
}
