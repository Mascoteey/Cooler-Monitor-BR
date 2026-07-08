import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Cpu, Monitor, MemoryStick, HardDrive,
  CircuitBoard, Activity, Fan, Network, BarChart3,
  Bell, Settings, Info, ChevronLeft, ChevronRight,
  Gauge,
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/cpu', icon: Cpu, label: 'CPU' },
  { path: '/gpu', icon: Monitor, label: 'GPU' },
  { path: '/memory', icon: MemoryStick, label: 'Memórias' },
  { path: '/storage', icon: HardDrive, label: 'Discos' },
  { path: '/motherboard', icon: CircuitBoard, label: 'Placa Mãe' },
  { path: '/sensors', icon: Activity, label: 'Sensores' },
  { path: '/fans', icon: Fan, label: 'Fans' },
  { path: '/network', icon: Network, label: 'Rede' },
  { path: '/history', icon: BarChart3, label: 'Histórico' },
  { path: '/alerts', icon: Bell, label: 'Alertas' },
  { path: '/settings', icon: Settings, label: 'Configurações' },
  { path: '/about', icon: Info, label: 'Sobre' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 240 : 72 }}
      className="h-full glass-panel flex flex-col overflow-hidden border-r border-[var(--color-border)] relative z-10"
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--color-border)]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center flex-shrink-0">
          <Gauge className="w-4 h-4 text-white" />
        </div>
        {sidebarOpen && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-bold text-sm tracking-wider"
          >
            <span className="gradient-text">COOLER MONITOR</span>
            <span className="text-[var(--color-primary)]"> BR</span>
          </motion.span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`sidebar-item w-full ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center p-3 border-t border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
      >
        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}
