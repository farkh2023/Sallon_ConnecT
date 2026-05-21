import { maskSensitiveClientText } from './safety';
import { getEvents, subscribeToEventBus } from './systemEventBus';
import type {
  LocalNotification,
  LocalNotificationSource,
  SystemEvent,
} from './types';

const NC_STORAGE_KEY = 'sallon_connect_notifications';
const NC_MAX = 100;
const GROUPING_WINDOW_MS = 5 * 60 * 1000;

const SKIP_TYPES = new Set(['sse.heartbeat', 'sse.connected', 'sse.error']);

const SOURCE_MAP: Record<string, LocalNotificationSource> = {
  backend:       'backend',
  frontend:      'frontend',
  network:       'network',
  scheduler:     'scheduler',
  backup:        'backup',
  security:      'security',
  notifications: 'system',
};

function _mapSource(src: string): LocalNotificationSource {
  return SOURCE_MAP[src] ?? 'system';
}

function _makeTitle(type: string): string {
  if (type.startsWith('backend.'))       return 'Backend';
  if (type.startsWith('sse.'))           return 'Flux SSE';
  if (type.startsWith('help.'))          return "Centre d'aide";
  if (type.startsWith('security.'))      return 'Sécurité';
  if (type.startsWith('notifications.')) return 'Notifications';
  if (type.startsWith('scheduler.'))     return 'Scheduler';
  if (type.startsWith('backup.'))        return 'Backup';
  return 'Système';
}

function _makeId(): string {
  return `nc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ---- Storage helpers ----

function _storageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const k = '__nc_test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch { return false; }
}

function _isValidNotification(n: unknown): n is LocalNotification {
  if (typeof n !== 'object' || n === null) return false;
  const o = n as Record<string, unknown>;
  return (
    typeof o.id === 'string' && typeof o.timestamp === 'string' &&
    typeof o.title === 'string' && typeof o.message === 'string' &&
    typeof o.severity === 'string' && typeof o.source === 'string' &&
    typeof o.read === 'boolean'
  );
}

function _load(): LocalNotification[] {
  if (!_storageAvailable()) return [];
  try {
    const raw = localStorage.getItem(NC_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter(_isValidNotification).slice(0, NC_MAX);
  } catch { return []; }
}

function _save(): void {
  if (!_storageAvailable()) return;
  try {
    localStorage.setItem(NC_STORAGE_KEY, JSON.stringify(_notifications.slice(0, NC_MAX)));
  } catch { /* QuotaExceeded — ignore */ }
}

function _clearStored(): void {
  if (!_storageAvailable()) return;
  try { localStorage.removeItem(NC_STORAGE_KEY); } catch { /* ignore */ }
}

// ---- Module state ----

let _notifications: LocalNotification[] = _load();
const _listeners = new Set<() => void>();
const _seenEventIds = new Set<string>();
let _initialized = false;

function _notify(): void {
  _listeners.forEach((l) => l());
}

function _onBusChange(): void {
  for (const evt of getEvents()) {
    if (!_seenEventIds.has(evt.id)) {
      processEvent(evt);
    }
  }
}

// ---- Public API ----

export function initNotificationCenter(): void {
  if (_initialized) return;
  _initialized = true;
  subscribeToEventBus(_onBusChange);
  _onBusChange();
}

export function processEvent(evt: SystemEvent): void {
  if (_seenEventIds.has(evt.id)) return;
  _seenEventIds.add(evt.id);

  if (SKIP_TYPES.has(evt.type)) return;

  const groupKey = evt.type;
  const now = Date.now();

  const existingIdx = _notifications.findIndex(
    (n) =>
      n.groupKey === groupKey &&
      !n.read &&
      now - new Date(n.timestamp).getTime() < GROUPING_WINDOW_MS,
  );

  if (existingIdx !== -1) {
    const existing = _notifications[existingIdx];
    const updated: LocalNotification = {
      ...existing,
      count: (existing.count ?? 1) + 1,
      timestamp: evt.timestamp,
      relatedEventIds: [...(existing.relatedEventIds ?? []), evt.id],
    };
    _notifications = [
      ..._notifications.slice(0, existingIdx),
      updated,
      ..._notifications.slice(existingIdx + 1),
    ];
  } else {
    const notification: LocalNotification = {
      id: _makeId(),
      timestamp: evt.timestamp,
      title: _makeTitle(evt.type),
      message: maskSensitiveClientText(evt.message),
      severity: evt.severity,
      source: _mapSource(evt.source),
      read: false,
      groupKey,
      count: 1,
      relatedEventIds: [evt.id],
    };
    _notifications = [notification, ..._notifications].slice(0, NC_MAX);
  }

  _save();
  _notify();
}

export function getNotifications(): LocalNotification[] {
  return _notifications;
}

export function getUnreadCount(): number {
  return _notifications.filter((n) => !n.read).length;
}

export function markNotificationRead(id: string): void {
  _notifications = _notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  _save();
  _notify();
}

export function markAllNotificationsRead(): void {
  _notifications = _notifications.map((n) => ({ ...n, read: true }));
  _save();
  _notify();
}

export function clearNotifications(): void {
  _notifications = [];
  _seenEventIds.clear();
  _clearStored();
  _notify();
}

export function subscribeToNotificationCenter(listener: () => void): () => void {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

export function resetNotificationCenter(): void {
  _notifications = [];
  _seenEventIds.clear();
  _initialized = false;
  _listeners.clear();
  _clearStored();
}
