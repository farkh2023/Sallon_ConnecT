import { maskSensitiveClientText } from './safety';
import { clearStoredEvents, loadEvents, saveEvents } from './systemEventStorage';
import type { SystemEvent, SystemEventSeverity, SystemEventSource } from './types';

const MAX_EVENTS = 200;

let _events: SystemEvent[] = loadEvents();
type Listener = () => void;
const _listeners = new Set<Listener>();

function _notify(): void {
  _listeners.forEach((l) => l());
}

function _makeId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function emitSystemEvent(event: {
  type: string;
  severity: SystemEventSeverity;
  source: SystemEventSource;
  message: string;
  details?: string;
}): void {
  const safe: SystemEvent = {
    id: _makeId(),
    timestamp: new Date().toISOString(),
    type: event.type,
    severity: event.severity,
    source: event.source,
    message: maskSensitiveClientText(event.message),
    details: event.details ? maskSensitiveClientText(event.details) : undefined,
    read: false,
  };
  _events = [safe, ..._events].slice(0, MAX_EVENTS);
  saveEvents(_events);
  _notify();
}

export function getEvents(): SystemEvent[] {
  return _events;
}

export function markEventRead(id: string): void {
  _events = _events.map((e) => (e.id === id ? { ...e, read: true } : e));
  saveEvents(_events);
  _notify();
}

export function markAllEventsRead(): void {
  _events = _events.map((e) => ({ ...e, read: true }));
  saveEvents(_events);
  _notify();
}

export function clearAllEvents(): void {
  _events = [];
  clearStoredEvents();
  _notify();
}

export function subscribeToEventBus(listener: Listener): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

export function getUnreadCount(): number {
  return _events.filter((e) => !e.read).length;
}

export function getEventsAsJson(): string {
  return JSON.stringify(_events, null, 2);
}

export function getEventsAsCsv(): string {
  const headers = 'id,timestamp,type,severity,source,message,details,read';
  const rows = _events.map((e) =>
    [
      e.id,
      e.timestamp,
      e.type,
      e.severity,
      e.source,
      `"${e.message.replace(/"/g, '""')}"`,
      `"${(e.details ?? '').replace(/"/g, '""')}"`,
      String(e.read),
    ].join(',')
  );
  return [headers, ...rows].join('\n');
}

export function exportEventsJson(): void {
  if (typeof document === 'undefined') return;
  const content = getEventsAsJson();
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `system-events-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportEventsCsv(): void {
  if (typeof document === 'undefined') return;
  const content = getEventsAsCsv();
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `system-events-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
