import type { SystemEvent } from './types';

export const STORAGE_KEY = 'sallon_connect_system_events';
export const RETENTION_MAX = 200;
export const RETENTION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function isValidEvent(e: unknown): e is SystemEvent {
  if (typeof e !== 'object' || e === null) return false;
  const obj = e as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.severity === 'string' &&
    typeof obj.source === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.read === 'boolean'
  );
}

export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__sc_test__';
    localStorage.setItem(test, '1');
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

export function loadEvents(): SystemEvent[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - RETENTION_MAX_AGE_MS;
    return (parsed as unknown[])
      .filter(isValidEvent)
      .filter((e) => new Date(e.timestamp).getTime() > cutoff)
      .slice(0, RETENTION_MAX);
  } catch {
    return [];
  }
}

export function saveEvents(events: SystemEvent[]): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, RETENTION_MAX)));
  } catch {
    // QuotaExceededError — fail silently
  }
}

export function clearStoredEvents(): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
