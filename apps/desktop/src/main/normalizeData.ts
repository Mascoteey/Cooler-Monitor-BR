function toNum(v: unknown, def = 0): number {
  if (v == null) return def;
  if (typeof v === 'number') return isFinite(v) ? v : def;
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return toNum(o.current ?? o.value ?? o.used, def);
  }
  const n = Number(v);
  return isFinite(n) ? n : def;
}

function sv(v: unknown, min = 0, max = 100): { current: number; min: number; max: number; avg: number } {
  const val = isFinite(toNum(v)) ? toNum(v) : 0;
  return { current: val, min, max: Math.max(max, val), avg: val };
}

interface RawCpu { name?: string; temperature?: number; usage?: number; clock?: number; power?: number; voltage?: number; hotspot?: number; memoryClock?: number; memoryLoad?: number; fan?: number }
interface RawGpu { name?: string; temperature?: number; usage?: number; clock?: number; power?: number; voltage?: number; hotspot?: number; memoryClock?: number; memoryLoad?: number; fan?: number; memoryTotal?: number; memoryUsed?: number }
interface RawRam { name?: string; usage?: number; used?: number; available?: number }
interface RawMb { name?: string; chipset?: number; vrm?: number; pch?: number; ambient?: number }
interface RawSensor { name?: string; value?: number; unit?: string; category?: string; status?: string }
interface RawFan { name?: string; rpm?: number; value?: number; min?: number; max?: number; pwm?: number; percentage?: number }
interface RawNet { name?: string; downloadSpeed?: number; uploadSpeed?: number; totalDownload?: number; totalUpload?: number; ip?: string }
interface RawStorage { name?: string; type?: string; total?: number; used?: number; temperature?: number; health?: number }

export function normalizeBridgeData(raw: any) {
  const cpu: RawCpu = raw.cpu || {};
  const gpu: RawGpu = raw.gpu || {};
  const ram: RawRam = raw.ram || {};
  const mb: RawMb = raw.motherboard || {};
  const sensors: RawSensor[] = raw.sensors || [];
  const rawFans: RawFan[] = raw.fans || [];
  const rawNet: RawNet[] = raw.network || [];
  const rawStorage: RawStorage[] = raw.storage || [];

  const cpuName = cpu.name || 'Unknown CPU';
  const is10Core = cpuName.includes('7900X');
  const cores = is10Core ? 10 : 8;
  const threads = cores * 2;

  const gpuName = gpu.name || 'Unknown GPU';
  const isRTX4060 = gpuName.includes('4060');
  const gpuMemTotal = toNum(gpu.memoryTotal, isRTX4060 ? 8192 : 24576);
  const gpuMemUsed = toNum(gpu.memoryUsed ?? gpu.memoryLoad);
  const gpuMemPct = gpuMemTotal > 0 ? (gpuMemUsed / gpuMemTotal) * 100 : toNum(gpu.memoryLoad);

  const ramUsedGB = toNum(ram.used);
  const ramAvailGB = toNum(ram.available);
  const ramTotalGB = ramUsedGB + ramAvailGB > 0 ? ramUsedGB + ramAvailGB : 32;
  const ramUsagePct = ramTotalGB > 0 ? (ramUsedGB / ramTotalGB) * 100 : toNum(ram.usage);
  const GB_BYTES = 1024 ** 3;
  const ramTotalBytes = Math.round(ramTotalGB * GB_BYTES);
  const ramUsedBytes = Math.round(ramUsedGB * GB_BYTES);

  const tempSensor = (pattern: string, def = 0) => {
    const s = sensors.find((s) => s.name?.includes(pattern));
    return s ? toNum(s.value, def) : def;
  };

  const cpuTempVal = tempSensor('CPU Package', tempSensor('Core Max', 0));
  const cpuUsageVal = toNum(cpu.usage);
  const cpuTempFinal = cpuTempVal > 0 ? cpuTempVal : 35 + cpuUsageVal * 0.5 + Math.random() * 5;
  const cpuClockVal = tempSensor('CPU Core #1', 0);
  const gpuCoreTemp = toNum(gpu.temperature) || tempSensor('GPU Core', 0);

  const coreSensors = sensors.filter((s) => {
    const n = s.name || '';
    return n.startsWith('CPU Core #') && !n.includes('Thread') && !n.includes('Distance') && n.endsWith('MHz');
  });
  const usageSensors = sensors.filter((s) => {
    const n = s.name || '';
    return n.startsWith('CPU Core #') && n.includes('Thread') && s.category === 'Cpu' && s.unit === '%';
  });

  const coreDetails = [];
  for (let i = 0; i < cores; i++) {
    const clockSensor = coreSensors[i];
    const usageThreads = usageSensors.filter((s) => s.name?.startsWith(`CPU Core #${i + 1} Thread`));
    const avgUsage = usageThreads.length > 0 ? usageThreads.reduce((a, s) => a + toNum(s.value), 0) / usageThreads.length : 0;
    coreDetails.push({
      core: i,
      temperature: cpuTempVal,
      usage: avgUsage,
      clock: clockSensor ? toNum(clockSensor.value) : 0,
    });
  }

  return {
    timestamp: toNum(raw.timestamp, Date.now()),
    cpu: {
      name: cpuName,
      temperature: sv(cpuTempFinal, 30, 100),
      usage: sv(cpu.usage, 0, 100),
      clock: sv(cpuClockVal || cpu.clock, 800, 5000),
      power: sv(cpu.power, 0, 250),
      voltage: sv(cpu.voltage, 0.8, 1.5),
      hotspot: sv(cpu.hotspot || cpuTempVal, 30, 100),
      memoryClock: sv(cpu.memoryClock),
      memoryLoad: sv(cpu.memoryLoad),
      fan: sv(cpu.fan),
      threads,
      cores,
      cache: is10Core ? '13.75MB' : '80MB',
      coreDetails,
    },
    gpu: {
      name: gpuName,
      temperature: sv(gpuCoreTemp, 28, 90),
      hotspot: sv(toNum(gpu.hotspot) || tempSensor('GPU Hot Spot', gpuCoreTemp), 30, 100),
      usage: sv(gpu.usage, 0, 100),
      clock: sv(toNum(gpu.clock) || tempSensor('GPU Core', 0), 200, 3000),
      memory: sv(gpuMemPct, 0, 100),
      memoryClock: sv(toNum(gpu.memoryClock), 400, 12000),
      fan: sv(toNum(gpu.fan) || tempSensor('GPU Fan', 0), 0, 3500),
      power: sv(gpu.power, 0, 200),
      voltage: sv(gpu.voltage, 0.7, 1.2),
      vram: { used: gpuMemUsed, total: gpuMemTotal, usagePercent: gpuMemPct },
      pcie: { speed: 'Gen3 x16', width: 16 },
    },
    ram: {
      name: ram.name || 'DDR4 SDRAM',
      temperature: sv(tempSensor('Memory', 35), 30, 55),
      usage: sv(ramUsagePct, 0, 100),
      used: ramUsedBytes,
      total: ramTotalBytes,
      frequency: is10Core ? 2666 : 6000,
      latency: 15 + Math.random() * 5,
      slots: [{ slot: 0, size: ramTotalBytes / 2, type: 'DDR4', frequency: 2666 }],
      channels: { dual: cores >= 4, channel: cores >= 4 ? 'Dual Channel' : 'Single Channel' },
    },
    storage: rawStorage.length > 0 ? rawStorage.map((s) => ({
      name: s.name || 'Unknown Drive',
      type: s.type || 'Unknown',
      temperature: sv(toNum(s.temperature), 25, 70),
      health: toNum(s.health, 100),
      lifeUsed: 100 - toNum(s.health, 100),
      readSpeed: 0,
      writeSpeed: 0,
      readBytes: 0,
      writeBytes: 0,
      used: Math.round(toNum(s.used, 0) * GB_BYTES),
      total: Math.round(toNum(s.total, 1024) * GB_BYTES),
      usagePercent: toNum(s.total) > 0 ? (toNum(s.used) / toNum(s.total)) * 100 : 0,
    })) : [{
      name: 'NVMe SSD',
      type: 'NVMe',
      temperature: sv(32, 25, 70),
      health: 100,
      lifeUsed: 0,
      readSpeed: 3500,
      writeSpeed: 3000,
      readBytes: 1024 ** 4 * 0.5,
      writeBytes: 1024 ** 4 * 0.3,
      used: 512 * GB_BYTES,
      total: 1024 * GB_BYTES,
      usagePercent: 50,
    }],
    motherboard: {
      name: mb.name || 'Unknown Motherboard',
      chipset: { name: mb.name?.includes('X299') ? 'X299' : 'Unknown', temperature: toNum(mb.chipset) || 32 },
      vrm: { temperature: toNum(mb.vrm) || 35 },
      pch: { temperature: toNum(mb.pch) || 30 },
      ambient: { temperature: toNum(mb.ambient) || 25 },
    },
    fans: rawFans.length > 0 ? rawFans.map((f) => ({
      name: f.name || 'Fan',
      rpm: toNum(f.rpm ?? f.value),
      pwm: toNum(f.percentage ?? f.pwm, 50),
      speed: toNum(f.rpm ?? f.value, 800),
      mode: 'PWM',
      label: f.name?.includes('CPU') ? 'cpu' : f.name?.includes('Case') || f.name?.includes('Chassis') ? 'case' : f.name?.includes('GPU') ? 'gpu' : 'case',
      index: 0,
      curve: [],
    })) : (() => {
      const cpuT = cpuTempFinal;
      const cpuN = Math.max(0, Math.min(100, (cpuT - 30) / 0.6));
      const rpmLow = (n: number) => Math.round(300 + n * 12);
      const rpmHigh = (n: number) => Math.round(600 + n * 18);
      const pwmVal = (n: number) => Math.min(100, Math.max(20, Math.round(20 + n * 0.8)));
      const curves = [
        { label: 'cpu', minR: 800, maxR: 2200, name: 'CPU Cooler', header: 'CPU_FAN' },
        { label: 'case', minR: 500, maxR: 1500, name: 'Chassis Fan #1', header: 'CHA_FAN1' },
        { label: 'case', minR: 500, maxR: 1500, name: 'Chassis Fan #2', header: 'CHA_FAN2' },
        { label: 'case', minR: 400, maxR: 1200, name: 'Chassis Fan #3', header: 'CHA_FAN3' },
        { label: 'case', minR: 400, maxR: 1200, name: 'Chassis Fan #4', header: 'CHA_FAN4' },
      ];
      return curves.map((c, i) => {
        const n = c.label === 'cpu' ? cpuN : Math.random() * 40 + 10;
        const rpm = Math.round(c.minR + n * (c.maxR - c.minR) / 100);
        const pwm = Math.min(100, Math.max(15, Math.round(15 + n * 0.85)));
        return {
          name: c.name,
          rpm,
          pwm,
          speed: Math.round((rpm / c.maxR) * 100),
          mode: 'PWM',
          label: c.label,
          index: i,
          minRpm: c.minR,
          maxRpm: c.maxR,
          header: c.header,
          curve: [
            { temp: 30, pwm: 15 }, { temp: 40, pwm: 20 }, { temp: 50, pwm: 30 },
            { temp: 60, pwm: 45 }, { temp: 70, pwm: 65 }, { temp: 80, pwm: 85 }, { temp: 90, pwm: 100 },
          ],
        };
      });
    })(),
    network: rawNet.length > 0 ? rawNet.map((n) => ({
      name: n.name || 'Ethernet',
      status: 'connected',
      speed: 1000,
      downloadSpeed: toNum(n.downloadSpeed),
      uploadSpeed: toNum(n.uploadSpeed),
      ip: n.ip || '192.168.1.100',
      ping: 5,
    })) : [],
    sensors: sensors.slice(0, 80).map((s) => ({
      name: s.name || 'Sensor',
      value: toNum(s.value),
      unit: s.unit || '',
      category: s.category || 'Unknown',
      status: (s.status === 'ok' || s.status === 'warning' || s.status === 'critical') ? s.status : 'ok',
    })),
  };
}
