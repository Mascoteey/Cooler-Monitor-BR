export interface SensorValue {
  current: number;
  min: number;
  max: number;
  avg: number;
}

export interface CoreDetail {
  core: number;
  temperature: number;
  usage: number;
  clock: number;
}

export interface CpuData {
  name: string;
  temperature: SensorValue;
  usage: SensorValue;
  clock: SensorValue;
  power: SensorValue;
  voltage: SensorValue;
  threads: number;
  cores: number;
  cache: string;
  coreDetails: CoreDetail[];
}

export interface GpuData {
  name: string;
  temperature: SensorValue;
  hotspot: SensorValue;
  usage: SensorValue;
  clock: SensorValue;
  memory: SensorValue;
  memoryClock: SensorValue;
  fan: SensorValue;
  power: SensorValue;
  voltage: SensorValue;
  vram: { used: number; total: number; usagePercent: number };
  pcie: { speed: string; width: number };
}

export interface RamData {
  name: string;
  temperature: SensorValue;
  usage: SensorValue;
  used: number;
  total: number;
  frequency: number;
  latency: number;
  slots: RamSlotData[];
  channels: { dual: boolean; channel: string };
}

export interface RamSlotData {
  slot: number;
  size: number;
  type: string;
  frequency: number;
}

export interface StorageData {
  name: string;
  type: string;
  temperature: SensorValue;
  health: number;
  lifeUsed: number;
  readSpeed: number;
  writeSpeed: number;
  readBytes: number;
  writeBytes: number;
  used: number;
  total: number;
  usagePercent: number;
}

export interface MotherboardData {
  name: string;
  chipset: { name: string; temperature: number };
  vrm: { temperature: number };
  pch: { temperature: number };
  ambient: { temperature: number };
}

export interface FanCurvePoint {
  temp: number;
  pwm: number;
}

export interface FanData {
  name: string;
  rpm: number;
  pwm: number;
  speed: number;
  mode: string;
  label: string;
  index: number;
  minRpm?: number;
  maxRpm?: number;
  header?: string;
  curve?: FanCurvePoint[];
}

export interface NetworkData {
  name: string;
  status: string;
  speed: number;
  downloadSpeed: number;
  uploadSpeed: number;
  ip: string;
  ping: number;
}

export interface GenericSensor {
  name: string;
  value: number;
  unit: string;
  category: string;
  status: 'ok' | 'warning' | 'critical';
}

export interface HardwareData {
  timestamp: number;
  cpu: CpuData;
  gpu: GpuData;
  ram: RamData;
  storage: StorageData[];
  motherboard: MotherboardData;
  fans: FanData[];
  network: NetworkData[];
  sensors: GenericSensor[];
}

export interface AlertConfig {
  id: string;
  name: string;
  sensor: string;
  condition: 'above' | 'below' | 'equal';
  value: number;
  enabled: boolean;
  notify: boolean;
  sound: boolean;
  popup: boolean;
  log: boolean;
}

export interface Profile {
  name: string;
  settings: Record<string, unknown>;
}

export interface ThemeConfig {
  mode: 'dark' | 'black' | 'blue' | 'purple' | 'green' | 'red' | 'custom';
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  accent: string;
  glowColor: string;
}

export interface HistoryEntry {
  timestamp: number;
  cpuTemp: number;
  cpuUsage: number;
  gpuTemp: number;
  gpuUsage: number;
  ramUsage: number;
}

export interface SystemInfo {
  os: string;
  osVersion: string;
  motherboard: string;
  bios: string;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string[];
  uptime: number;
}

export type PageRoute =
  | 'dashboard'
  | 'cpu'
  | 'gpu'
  | 'memory'
  | 'storage'
  | 'motherboard'
  | 'sensors'
  | 'fans'
  | 'benchmark'
  | 'network'
  | 'history'
  | 'alerts'
  | 'logs'
  | 'settings'
  | 'updates'
  | 'about';
