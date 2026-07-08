import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { resolve, join } from 'path';

export class HardwareBridge extends EventEmitter {
  private process: ChildProcess | null = null;
  private buffer = '';
  private running = false;

  start(bridgePath?: string): void {
    if (this.running) return;
    this.running = true;

    const path = bridgePath || resolve(
      __dirname,
      '../../../hardware-bridge/CoolerHardwareBridge/bin/Release/net8.0/publish/CoolerHardwareBridge.exe',
    );

    try {
      this.process = spawn(path, [], { stdio: ['pipe', 'pipe', 'pipe'] });
      this.process.stdout?.on('data', (data: Buffer) => {
        this.buffer += data.toString();
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              this.emit('data', parsed);
            } catch { /* skip */ }
          }
        }
      });
      this.process.stderr?.on('data', (data: Buffer) => {
        console.error(`[HW Bridge] ${data.toString().trim()}`);
      });
      this.process.on('exit', (code) => {
        console.error(`[HW Bridge] exited with code ${code}`);
        this.running = false;
        this.emit('exit', code);
        if (code !== 0) setTimeout(() => this.start(bridgePath), 2000);
      });
    } catch (err) {
      console.error('[HW Bridge] failed to start:', err);
      this.running = false;
    }
  }

  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.running = false;
  }

  get isRunning(): boolean {
    return this.running;
  }
}

export { SensorSimulator } from './simulator';
