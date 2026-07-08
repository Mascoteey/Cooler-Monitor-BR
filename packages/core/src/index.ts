export class HardwareManager {
  private listeners: Array<(data: unknown) => void> = [];

  onData(callback: (data: unknown) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  protected emit(data: unknown): void {
    for (const listener of this.listeners) {
      listener(data);
    }
  }
}

export class ProfileManager {
  private profiles: Map<string, Record<string, unknown>> = new Map();

  constructor(defaults: Array<{ name: string; settings: Record<string, unknown> }> = []) {
    for (const p of defaults) {
      this.profiles.set(p.name, p.settings);
    }
  }

  get(name: string): Record<string, unknown> | undefined {
    return this.profiles.get(name);
  }

  set(name: string, settings: Record<string, unknown>): void {
    this.profiles.set(name, settings);
  }

  list(): string[] {
    return Array.from(this.profiles.keys());
  }

  delete(name: string): boolean {
    return this.profiles.delete(name);
  }
}

export class AlertManager {
  private alerts: Array<{ id: string; message: string; type: 'warning' | 'critical' | 'info'; timestamp: number }> = [];
  private listeners: Array<(alert: { id: string; message: string; type: 'warning' | 'critical' | 'info'; timestamp: number }) => void> = [];

  trigger(message: string, type: 'warning' | 'critical' | 'info' = 'info'): void {
    const alert = { id: crypto.randomUUID(), message, type, timestamp: Date.now() };
    this.alerts.push(alert);
    for (const listener of this.listeners) {
      listener(alert);
    }
  }

  onAlert(callback: (alert: { id: string; message: string; type: 'warning' | 'critical' | 'info'; timestamp: number }) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  getAll() { return this.alerts; }
  dismiss(id: string) { this.alerts = this.alerts.filter((a) => a.id !== id); }
}

export * from './types';
