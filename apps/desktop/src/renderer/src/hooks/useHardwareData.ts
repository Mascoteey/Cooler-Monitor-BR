import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { HardwareData } from '@cooler-monitor/shared';

function genData(): HardwareData {
  const cpuT = 42 + Math.random() * 20;
  const cpuU = 5 + Math.random() * 25;
  const cpuC = 3300 + Math.random() * 500;
  const gpuT = 35 + Math.random() * 18;
  const gpuU = 2 + Math.random() * 15;
  const gpuC = 1800 + Math.random() * 150;
  const ramU = 25 + Math.random() * 15;
  const ramTotal = 32 * 1024 * 1024 * 1024;
  const ramUsed = ramTotal * ramU / 100;
  return {
    timestamp: Date.now(),
    cpu: {
      name: 'Intel Core i9-7900X',
      temperature: { current: cpuT, min: 30, max: 95, avg: cpuT },
      usage: { current: cpuU, min: 0, max: 100, avg: cpuU },
      clock: { current: cpuC, min: 1200, max: 4500, avg: cpuC },
      power: { current: 55 + Math.random() * 50, min: 10, max: 250, avg: 80 },
      voltage: { current: 1.1 + Math.random() * 0.1, min: 0.8, max: 1.4, avg: 1.15 },
      threads: 20, cores: 10, cache: '13.75MB',
      coreDetails: Array.from({ length: 10 }, (_, i) => ({
        core: i,
        temperature: 35 + Math.random() * 30,
        usage: Math.random() * 25,
        clock: 3200 + Math.random() * 500,
      })),
    },
    gpu: {
      name: 'NVIDIA GeForce RTX 4060',
      temperature: { current: gpuT, min: 28, max: 83, avg: gpuT },
      hotspot: { current: gpuT + 5, min: 30, max: 95, avg: gpuT + 5 },
      usage: { current: gpuU, min: 0, max: 100, avg: gpuU },
      clock: { current: gpuC, min: 210, max: 2460, avg: gpuC },
      memory: { current: 8 + Math.random() * 10, min: 0, max: 100, avg: 10 },
      memoryClock: { current: 2100 + Math.random() * 100, min: 405, max: 2200, avg: 2000 },
      fan: { current: 800 + Math.random() * 400, min: 0, max: 3000, avg: 1000 },
      power: { current: 35 + Math.random() * 40, min: 8, max: 160, avg: 50 },
      voltage: { current: 0.95 + Math.random() * 0.08, min: 0.7, max: 1.1, avg: 0.95 },
      vram: { used: 1024 + Math.random() * 2048, total: 8192, usagePercent: 15 + Math.random() * 25 },
      pcie: { speed: 'Gen3 x16', width: 16 },
    },
    ram: {
      name: 'Corsair Vengeance DDR4',
      temperature: { current: 33 + Math.random() * 8, min: 28, max: 55, avg: 36 },
      usage: { current: ramU, min: 5, max: 90, avg: ramU },
      used: ramUsed,
      total: ramTotal,
      frequency: 2666,
      latency: 16 + Math.random() * 3,
      slots: [{ slot: 0, size: 16 * 1024 * 1024 * 1024, type: 'DDR4', frequency: 2666 }],
      channels: { dual: true, channel: 'Dual Channel' },
    },
    storage: [{
      name: 'Samsung SSD 970 EVO 1TB',
      type: 'NVMe',
      temperature: { current: 32 + Math.random() * 8, min: 25, max: 70, avg: 35 },
      health: 98,
      lifeUsed: 2,
      readSpeed: 3500,
      writeSpeed: 3200,
      readBytes: 1024 ** 4 * 0.5,
      writeBytes: 1024 ** 4 * 0.3,
      used: 420 * 1024 * 1024 * 1024,
      total: 1024 * 1024 * 1024 * 1024,
      usagePercent: 41 + Math.random() * 5,
    }],
    motherboard: {
      name: 'ASUS TUF X299 MARK 2',
      chipset: { name: 'X299', temperature: 32 + Math.random() * 8 },
      vrm: { temperature: 35 + Math.random() * 10 },
      pch: { temperature: 30 + Math.random() * 8 },
      ambient: { temperature: 25 + Math.random() * 4 },
    },
    fans: (() => {
      const base = (i: number, name: string, label: string, minR: number, maxR: number, h: string) => {
        const n = label === 'cpu' ? cpuU + 10 : Math.random() * 40 + 10;
        const rpm = Math.round(minR + n * (maxR - minR) / 100);
        const pwm = Math.min(100, Math.max(15, Math.round(15 + n * 0.85)));
        return { name, rpm, pwm, speed: Math.round((rpm / maxR) * 100), mode: 'PWM', label, index: i, minRpm: minR, maxRpm: maxR, header: h, curve: [{ temp: 30, pwm: 15 }, { temp: 40, pwm: 20 }, { temp: 50, pwm: 30 }, { temp: 60, pwm: 45 }, { temp: 70, pwm: 65 }, { temp: 80, pwm: 85 }, { temp: 90, pwm: 100 }] };
      };
      return [
        base(0, 'CPU Cooler', 'cpu', 800, 2200, 'CPU_FAN'),
        base(1, 'Chassis Fan #1', 'case', 500, 1500, 'CHA_FAN1'),
        base(2, 'Chassis Fan #2', 'case', 500, 1500, 'CHA_FAN2'),
        base(3, 'Chassis Fan #3', 'case', 400, 1200, 'CHA_FAN3'),
        base(4, 'Chassis Fan #4', 'case', 400, 1200, 'CHA_FAN4'),
      ];
    })(),
    network: [{
      name: 'Ethernet', status: 'connected', speed: 1000,
      downloadSpeed: 25000000 + Math.random() * 50000000,
      uploadSpeed: 10000000 + Math.random() * 20000000,
      ip: '192.168.1.100', ping: 5 + Math.random() * 10,
    }],
    sensors: [
      { name: 'CPU Package', value: cpuT, unit: '°C', category: 'CPU', status: 'ok' },
      { name: 'CPU Total', value: cpuU, unit: '%', category: 'CPU', status: 'ok' },
      { name: 'GPU Core', value: gpuT, unit: '°C', category: 'GPU', status: 'ok' },
      { name: 'GPU Usage', value: gpuU, unit: '%', category: 'GPU', status: 'ok' },
      { name: 'Memory Used', value: ramU, unit: '%', category: 'Memory', status: 'ok' },
    ],
  };
}

export function useHardwareData(): HardwareData | null {
  const hardwareData = useStore((s) => s.hardwareData);
  const setHardwareData = useStore((s) => s.setHardwareData);
  const hasReceivedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const cleanup = window.electronAPI?.onHardwareData((data) => {
      if (!hasReceivedRef.current) {
        hasReceivedRef.current = true;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      setHardwareData(data as HardwareData);
    });
    const timeoutId = setTimeout(() => {
      if (!hasReceivedRef.current) {
        intervalRef.current = setInterval(() => {
          setHardwareData(genData());
        }, 1000);
        setHardwareData(genData());
      }
    }, 3000);
    return () => {
      cleanup?.();
      clearTimeout(timeoutId);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [setHardwareData]);

  return hardwareData;
}
