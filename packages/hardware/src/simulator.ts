import { EventEmitter } from 'events';

export class SensorSimulator extends EventEmitter {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private interval = 1000;

  start(intervalMs = 1000): void {
    this.interval = intervalMs;
    this.intervalId = setInterval(() => {
      this.emit('data', this.generateData());
    }, this.interval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private generateData() {
    return {
      timestamp: Date.now(),
      cpu: {
        name: 'AMD Ryzen 9 7950X',
        temperature: 45 + Math.random() * 30,
        usage: 5 + Math.random() * 25,
        clock: 4500 + Math.random() * 800,
        power: 65 + Math.random() * 60,
        voltage: 1.25 + Math.random() * 0.1,
      },
      gpu: {
        name: 'NVIDIA GeForce RTX 4090',
        temperature: 38 + Math.random() * 25,
        hotspot: 45 + Math.random() * 30,
        usage: 2 + Math.random() * 15,
        clock: 2520 + Math.random() * 200,
        memoryClock: 10501 + Math.random() * 500,
        fan: 800 + Math.random() * 400,
        power: 120 + Math.random() * 100,
        voltage: 1.05 + Math.random() * 0.05,
      },
      ram: {
        name: 'DDR5-6000 32GB',
        usage: 20 + Math.random() * 20,
        used: 8192 + Math.random() * 8192,
        available: 24576 - Math.random() * 8192,
      },
      storage: [
        {
          name: 'Samsung 990 Pro 2TB',
          temperature: 35 + Math.random() * 15,
          usedPercent: 25 + Math.random() * 5,
          used: 512e9,
          total: 2e12,
        },
      ],
      motherboard: {
        name: 'ASUS ROG CROSSHAIR X670E HERO',
        chipset: 35 + Math.random() * 15,
        vrm: 38 + Math.random() * 20,
        pch: 33 + Math.random() * 12,
        ambient: 25 + Math.random() * 5,
      },
      fans: [
        { name: 'CPU Cooler', rpm: 1200 + Math.random() * 400 },
        { name: 'Case Front', rpm: 800 + Math.random() * 200 },
        { name: 'Case Rear', rpm: 700 + Math.random() * 150 },
      ],
      network: [
        { name: 'Ethernet', downloadSpeed: 25e6 + Math.random() * 50e6, uploadSpeed: 10e6 + Math.random() * 20e6 },
      ],
      sensors: Array.from({ length: 20 }, (_, i) => ({
        name: `Sensor #${i + 1}`,
        value: Math.random() * 100,
        unit: ['°C', '%', 'W', 'V', 'MHz', 'RPM'][Math.floor(Math.random() * 6)],
        category: ['CPU', 'GPU', 'RAM', 'Motherboard'][Math.floor(Math.random() * 4)],
        status: Math.random() > 0.1 ? 'ok' : Math.random() > 0.5 ? 'warning' : 'critical',
      })),
    };
  }
}
