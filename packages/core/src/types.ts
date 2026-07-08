export interface BridgeSensorData {
  timestamp: number;
  cpu: {
    name: string;
    temperature: number;
    usage: number;
    clock: number;
    power: number;
    voltage: number;
  };
  gpu: {
    name: string;
    temperature: number;
    hotspot: number;
    usage: number;
    clock: number;
    memoryClock: number;
    fan: number;
    power: number;
    voltage: number;
  };
  ram: {
    name: string;
    usage: number;
    used: number;
    available: number;
  };
  storage: Array<{
    name: string;
    temperature: number;
    usedPercent: number;
    used: number;
    total: number;
  }>;
  motherboard: {
    name: string;
    chipset: number;
    vrm: number;
    pch: number;
    ambient: number;
  };
  fans: Array<{ name: string; rpm: number }>;
  network: Array<{ name: string; downloadSpeed: number; uploadSpeed: number }>;
  sensors: Array<{
    name: string;
    value: number;
    unit: string;
    category: string;
    status: string;
  }>;
}
