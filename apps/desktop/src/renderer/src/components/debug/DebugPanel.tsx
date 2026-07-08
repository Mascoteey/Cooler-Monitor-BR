import { useEffect, useState, useRef, useCallback } from 'react';
import { useDebugStore, TestResult, DebugLog, TestStatus } from '../../store/useDebugStore';
import { useStore } from '../../store/useStore';
import { runAllTests, runTest, captureStoreSnapshot } from '../../utils/systemTest';

type TabId = 'status' | 'tests' | 'store' | 'logs' | 'perf';

export default function DebugPanel() {
  const visible = useDebugStore((s) => s.visible);
  const activeTab = useDebugStore((s) => s.activeTab);
  const setActiveTab = useDebugStore((s) => s.setActiveTab);
  const toggle = useDebugStore((s) => s.toggle);
  const logs = useDebugStore((s) => s.logs);
  const testResults = useDebugStore((s) => s.testResults);
  const addLog = useDebugStore((s) => s.addLog);
  const clearLogs = useDebugStore((s) => s.clearLogs);
  const setTestResult = useDebugStore((s) => s.setTestResult);
  const systemStatus = useDebugStore((s) => s.systemStatus);
  const updateSystemStatus = useDebugStore((s) => s.updateSystemStatus);
  const storeSnapshot = useDebugStore((s) => s.storeSnapshot);
  const setStoreSnapshot = useDebugStore((s) => s.setStoreSnapshot);

  const [running, setRunning] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const fpsRef = useRef({ frames: 0, lastTime: performance.now(), fps: 0 });
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState(0);

  const hardwareData = useStore((s) => s.hardwareData);
  const currentPage = useStore((s) => s.currentPage);
  const theme = useStore((s) => s.theme);
  const historyCount = useStore((s) => s.history.length);
  const alertsCount = useStore((s) => s.alerts.length);

  const dataSource = hardwareData
    ? (hardwareData.cpu.name.includes('Intel') || hardwareData.cpu.name.includes('AMD')
      ? 'bridge' : 'simulated')
    : 'none';

  useEffect(() => {
    updateSystemStatus({
      dataSource: dataSource as 'bridge' | 'simulated' | 'none',
      lastDataAge: hardwareData ? Date.now() - hardwareData.timestamp : -1,
      windowState: currentPage,
    });
  }, [hardwareData, currentPage]);

  useEffect(() => {
    if (!visible || activeTab !== 'perf') return;
    let rafId: number;
    const loop = () => {
      const now = performance.now();
      fpsRef.current.frames++;
      if (now - fpsRef.current.lastTime >= 1000) {
        fpsRef.current.fps = fpsRef.current.frames;
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = now;
        setFps(fpsRef.current.fps);
        if ((performance as any).memory?.usedJSHeapSize) {
          setMemory(Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024));
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [visible, activeTab]);

  const handleRunAll = useCallback(async () => {
    setRunning(true);
    setAllDone(false);
    addLog({ level: 'info', message: 'Iniciando todos os testes...', source: 'debug' });
    const results = await runAllTests();
    results.forEach((r) => setTestResult(r));
    const passed = results.filter((r) => r.status === 'pass').length;
    const failed = results.filter((r) => r.status === 'fail').length;
    const warned = results.filter((r) => r.status === 'warn').length;
    addLog({ level: passed === results.length ? 'info' : 'warn', message: `Testes concluídos: ${passed} pass, ${failed} fail, ${warned} warn`, source: 'debug' });
    setRunning(false);
    setAllDone(true);
  }, []);

  const handleRunSingle = useCallback(async (id: string) => {
    setTestResult({ id, name: '', description: '', status: 'running' });
    const result = await runTest(id);
    setTestResult(result);
    addLog({ level: result.status === 'pass' ? 'info' : result.status === 'fail' ? 'error' : 'warn', message: `Teste "${result.name}": ${result.status}${result.error ? ` - ${result.error}` : ''}`, source: 'debug' });
  }, []);

  const handleRefreshStore = useCallback(() => {
    const snap = captureStoreSnapshot();
    setStoreSnapshot(snap);
    addLog({ level: 'info', message: 'Store snapshot atualizado', source: 'debug' });
  }, []);

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'status', label: 'Status' },
    { id: 'tests', label: 'Testes' },
    { id: 'store', label: 'Store' },
    { id: 'logs', label: 'Logs' },
    { id: 'perf', label: 'Perf' },
  ];

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, right: 0, width: '520px', maxHeight: '100vh',
      background: '#0f0f23', borderLeft: '1px solid #1a1a3e', borderTop: '1px solid #1a1a3e',
      zIndex: 99999, display: 'flex', flexDirection: 'column', fontFamily: "'JetBrains Mono', monospace",
      fontSize: '12px', color: '#e2e8f0', boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', background: '#1a1a3e', borderBottom: '1px solid #2a2a5e',
      }}>
        <span style={{ fontWeight: 700, fontSize: '13px', color: '#00b4ff' }}>
          🛠 DEBUG PANEL
          <span style={{ marginLeft: 8, fontSize: '10px', color: '#64748b' }}>
            {systemStatus.dataSource === 'bridge' ? '🔵 Bridge real' : systemStatus.dataSource === 'simulated' ? '🟡 Dados simulados' : '⚪ Sem dados'}
          </span>
        </span>
        <button onClick={toggle} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>✕</button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a3e' }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1, padding: '6px 4px', border: 'none', cursor: 'pointer', fontSize: '11px',
              background: activeTab === tab.id ? '#0f0f23' : '#151530',
              color: activeTab === tab.id ? '#00b4ff' : '#64748b',
              borderBottom: activeTab === tab.id ? '2px solid #00b4ff' : '2px solid transparent',
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {activeTab === 'status' && <StatusTab systemStatus={systemStatus} dataSource={dataSource} />}
        {activeTab === 'tests' && (
          <TestsTab testResults={testResults} running={running} allDone={allDone}
            onRunAll={handleRunAll} onRunSingle={handleRunSingle} />
        )}
        {activeTab === 'store' && (
          <StoreTab snapshot={storeSnapshot} onRefresh={handleRefreshStore} />
        )}
        {activeTab === 'logs' && <LogsTab logs={logs} onClear={clearLogs} />}
        {activeTab === 'perf' && <PerfTab fps={fps} memory={memory} />}
      </div>
    </div>
  );
}

function StatusTab({ systemStatus, dataSource }: { systemStatus: any; dataSource: string }) {
  const items = [
    { label: 'Fonte de dados', value: systemStatus.dataSource === 'bridge' ? 'Bridge real (LibreHardwareMonitor)' : systemStatus.dataSource === 'simulated' ? 'Dados simulados (fallback)' : 'Nenhum', color: statusColor(systemStatus.dataSource) },
    { label: 'Bridge C#', value: systemStatus.bridgeProcess === 'running' ? 'Executando' : systemStatus.bridgeProcess === 'dead' ? 'Parado' : 'Desconhecido', color: statusColor(systemStatus.bridgeProcess) },
    { label: 'Canal IPC', value: systemStatus.ipcChannel === 'ok' ? 'Funcionando' : systemStatus.ipcChannel === 'error' ? 'Erro' : 'Não testado', color: statusColor(systemStatus.ipcChannel) },
    { label: 'Store (Zustand)', value: systemStatus.storeHealthy ? 'Saudável' : 'Verificar', color: systemStatus.storeHealthy ? '#22c55e' : '#fbbf24' },
    { label: 'Router', value: systemStatus.routerReady ? 'Pronto' : 'Verificar', color: systemStatus.routerReady ? '#22c55e' : '#fbbf24' },
    { label: 'Janela atual', value: systemStatus.windowState || 'desconhecido', color: '#64748b' },
    { label: 'Últimos dados', value: systemStatus.lastDataAge < 0 ? 'Nunca' : `${systemStatus.lastDataAge}ms atrás`, color: systemStatus.lastDataAge < 2000 ? '#22c55e' : systemStatus.lastDataAge < 5000 ? '#fbbf24' : '#ef4444' },
  ];
  return (
    <div>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1a1a3e' }}>
          <span style={{ color: '#94a3b8' }}>{item.label}</span>
          <span style={{ color: item.color || '#e2e8f0' }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function statusColor(s: string) {
  switch (s) {
    case 'bridge': case 'running': case 'ok': case 'saudável': case 'pronto': return '#22c55e';
    case 'simulated': case 'dead': case 'error': return '#fbbf24';
    case 'none': case 'unknown': return '#64748b';
    default: return '#e2e8f0';
  }
}

function TestsTab({ testResults, running, allDone, onRunAll, onRunSingle }: {
  testResults: TestResult[];
  running: boolean;
  allDone: boolean;
  onRunAll: () => void;
  onRunSingle: (id: string) => void;
}) {
  const passed = testResults.filter((r) => r.status === 'pass').length;
  const failed = testResults.filter((r) => r.status === 'fail').length;
  const warned = testResults.filter((r) => r.status === 'warn').length;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={onRunAll} disabled={running}
          style={{
            padding: '6px 16px', background: running ? '#334' : '#00b4ff', border: 'none',
            color: '#fff', cursor: running ? 'wait' : 'pointer', borderRadius: 4, fontWeight: 600,
          }}>
          {running ? 'Executando...' : '▶ Executar todos'}
        </button>
        {allDone && (
          <span style={{ fontSize: 11, alignSelf: 'center', color: '#94a3b8' }}>
            ✅ {passed} pass • ❌ {failed} fail • ⚠️ {warned} warn • {testResults.length} total
          </span>
        )}
      </div>
      {testResults.length === 0 && !running && (
        <div style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>
          Clique em "Executar todos" para testar o sistema
        </div>
      )}
      {testResults.map((result) => (
        <div key={result.id} style={{
          padding: '6px 8px', marginBottom: 4, borderRadius: 4,
          background: result.status === 'pass' ? 'rgba(34,197,94,0.08)' : result.status === 'fail' ? 'rgba(239,68,68,0.08)' : result.status === 'warn' ? 'rgba(251,191,36,0.08)' : 'transparent',
          border: `1px solid ${
            result.status === 'pass' ? 'rgba(34,197,94,0.2)' : result.status === 'fail' ? 'rgba(239,68,68,0.2)' : result.status === 'warn' ? 'rgba(251,191,36,0.2)' : '#1a1a3e'
          }`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 12 }}>
                {result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : result.status === 'warn' ? '⚠️' : result.status === 'running' ? '⏳' : '⚪'} {result.name}
              </span>
              <span style={{ marginLeft: 8, fontSize: 10, color: '#64748b' }}>{result.id}</span>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {result.duration != null && <span style={{ fontSize: 10, color: '#64748b' }}>{result.duration}ms</span>}
              {result.status === 'idle' && (
                <button onClick={() => onRunSingle(result.id)}
                  style={{ background: 'none', border: '1px solid #334', color: '#94a3b8', cursor: 'pointer', borderRadius: 2, fontSize: 10, padding: '1px 6px' }}>
                  executar
                </button>
              )}
            </div>
          </div>
          {result.error && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>{result.error}</div>}
          {result.details && !result.error && <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>{result.details}</div>}
        </div>
      ))}
    </div>
  );
}

function StoreTab({ snapshot, onRefresh }: { snapshot: string; onRefresh: () => void }) {
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <button onClick={onRefresh}
          style={{ padding: '4px 12px', background: '#1a1a3e', border: '1px solid #2a2a5e', color: '#e2e8f0', cursor: 'pointer', borderRadius: 4, fontSize: 11 }}>
          🔄 Atualizar snapshot
        </button>
      </div>
      <pre style={{
        background: '#0a0a1a', padding: 8, borderRadius: 4, overflow: 'auto', maxHeight: 400,
        fontSize: 11, lineHeight: 1.5, color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      }}>
        {snapshot}
      </pre>
    </div>
  );
}

function LogsTab({ logs, onClear }: { logs: DebugLog[]; onClear: () => void }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <button onClick={onClear}
          style={{ padding: '4px 12px', background: '#1a1a3e', border: '1px solid #2a2a5e', color: '#e2e8f0', cursor: 'pointer', borderRadius: 4, fontSize: 11 }}>
          🗑 Limpar logs
        </button>
        <span style={{ marginLeft: 8, fontSize: 11, color: '#64748b' }}>{logs.length} entradas</span>
      </div>
      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        {logs.length === 0 && <div style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>Nenhum log capturado</div>}
        {logs.map((log, i) => (
          <div key={i} style={{
            padding: '2px 4px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
            borderBottom: '1px solid rgba(26,26,62,0.5)',
            color: log.level === 'error' ? '#ef4444' : log.level === 'warn' ? '#fbbf24' : '#94a3b8',
          }}>
            <span style={{ color: '#64748b' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
            <span style={{ color: '#e2e8f0' }}>[{log.source}]</span>{' '}
            {log.message}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function PerfTab({ fps, memory }: { fps: number; memory: number }) {
  const [memInfo, setMemInfo] = useState('');
  useEffect(() => {
    const m = (performance as any).memory;
    if (m) {
      const total = Math.round(m.jsHeapSizeLimit / 1024 / 1024);
      const used = Math.round(m.usedJSHeapSize / 1024 / 1024);
      setMemInfo(`${used}MB / ${total}MB`);
    } else {
      setMemInfo('N/A (sem exposed memory API)');
    }
    const timer = setInterval(() => {
      if ((performance as any).memory) {
        const used = Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
        const total = Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024);
        setMemInfo(`${used}MB / ${total}MB`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a3e' }}>
        <span style={{ color: '#94a3b8' }}>FPS</span>
        <span style={{ color: fps >= 30 ? '#22c55e' : fps >= 15 ? '#fbbf24' : '#ef4444', fontWeight: 600 }}>
          {fps}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a3e' }}>
        <span style={{ color: '#94a3b8' }}>Memória Heap</span>
        <span style={{ color: '#e2e8f0' }}>{memInfo}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a3e' }}>
        <span style={{ color: '#94a3b8' }}>Navigator</span>
        <span style={{ color: '#e2e8f0', fontSize: 10 }}>{navigator.userAgent.substring(0, 60)}...</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a3e' }}>
        <span style={{ color: '#94a3b8' }}>Window size</span>
        <span style={{ color: '#e2e8f0' }}>{window.innerWidth}x{window.innerHeight}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a3e' }}>
        <span style={{ color: '#94a3b8' }}>WebSocket</span>
        <span style={{ color: '#64748b' }}>Verificar na guia Network</span>
      </div>
    </div>
  );
}
