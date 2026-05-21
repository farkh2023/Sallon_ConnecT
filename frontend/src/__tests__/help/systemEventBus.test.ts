import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAllEvents,
  emitSystemEvent,
  getEvents,
  getEventsAsCsv,
  getEventsAsJson,
  getUnreadCount,
  markAllEventsRead,
  markEventRead,
  subscribeToEventBus,
} from '@/lib/systemEventBus';
import { STORAGE_KEY } from '@/lib/systemEventStorage';

beforeEach(() => { localStorage.clear(); clearAllEvents(); });
afterEach(() => { clearAllEvents(); localStorage.clear(); });

function emit(msg = 'test', overrides: Partial<Parameters<typeof emitSystemEvent>[0]> = {}) {
  emitSystemEvent({ type: 'test', severity: 'info', source: 'backend', message: msg, ...overrides });
}

describe('systemEventBus — création', () => {
  it('crée un événement avec id, timestamp, read=false', () => {
    emit('hello');
    const [evt] = getEvents();
    expect(evt.id).toMatch(/^evt_/);
    expect(evt.timestamp).toBeTruthy();
    expect(evt.read).toBe(false);
    expect(evt.message).toBe('hello');
  });

  it('les événements sont en ordre LIFO (plus récent en premier)', () => {
    emit('premier');
    emit('dernier');
    const events = getEvents();
    expect(events[0].message).toBe('dernier');
    expect(events[1].message).toBe('premier');
  });

  it('limite à 200 événements', () => {
    for (let i = 0; i < 250; i++) emit(`evt-${i}`);
    expect(getEvents().length).toBe(200);
  });
});

describe('systemEventBus — compteur non lus', () => {
  it('compte les événements non lus', () => {
    emit(); emit(); emit();
    expect(getUnreadCount()).toBe(3);
  });

  it('markEventRead réduit le compteur', () => {
    emit('a'); emit('b');
    const id = getEvents()[0].id;
    markEventRead(id);
    expect(getUnreadCount()).toBe(1);
  });

  it('markAllEventsRead remet tout à zéro', () => {
    emit(); emit(); emit();
    markAllEventsRead();
    expect(getUnreadCount()).toBe(0);
  });
});

describe('systemEventBus — vider', () => {
  it('clearAllEvents vide le journal', () => {
    emit(); emit();
    clearAllEvents();
    expect(getEvents().length).toBe(0);
    expect(getUnreadCount()).toBe(0);
  });
});

describe('systemEventBus — listeners', () => {
  it('notifie les listeners à chaque événement', () => {
    const listener = vi.fn();
    const unsub = subscribeToEventBus(listener);
    emit();
    expect(listener).toHaveBeenCalledOnce();
    unsub();
    emit();
    expect(listener).toHaveBeenCalledOnce();
  });

  it('notifie les listeners sur markAllEventsRead', () => {
    const listener = vi.fn();
    const unsub = subscribeToEventBus(listener);
    emit();
    markAllEventsRead();
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
  });

  it('notifie les listeners sur clearAllEvents', () => {
    const listener = vi.fn();
    const unsub = subscribeToEventBus(listener);
    emit();
    clearAllEvents();
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
  });
});

describe('systemEventBus — persistance localStorage', () => {
  it('emitSystemEvent sauvegarde dans localStorage', () => {
    emit('persisté');
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as Array<{ message: string }>;
    expect(parsed[0].message).toBe('persisté');
  });

  it('markEventRead met à jour localStorage', () => {
    emit('test-read');
    const id = getEvents()[0].id;
    markEventRead(id);
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as Array<{ read: boolean }>;
    expect(parsed[0].read).toBe(true);
  });

  it('clearAllEvents supprime la clé localStorage', () => {
    emit();
    clearAllEvents();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('getEventsAsJson retourne un JSON valide des événements', () => {
    emit('export-json');
    const json = getEventsAsJson();
    const parsed = JSON.parse(json) as Array<{ message: string }>;
    expect(parsed[0].message).toBe('export-json');
  });

  it('getEventsAsCsv contient l\'entête et les données', () => {
    emit('export-csv');
    const csv = getEventsAsCsv();
    expect(csv).toContain('id,timestamp,type,severity,source,message,details,read');
    expect(csv).toContain('export-csv');
  });

  it('getEventsAsJson retourne [] si aucun événement', () => {
    const json = getEventsAsJson();
    expect(JSON.parse(json)).toEqual([]);
  });

  it('getEventsAsCsv ne contient que l\'entête si aucun événement', () => {
    const csv = getEventsAsCsv();
    expect(csv.trim()).toBe('id,timestamp,type,severity,source,message,details,read');
  });
});

describe('systemEventBus — sécurité', () => {
  it('masque les données sensibles dans le message', () => {
    const sensitive = ['abc123', 'def456', 'xyz789'].join('');
    emit(`Bearer ${sensitive}`);
    const [evt] = getEvents();
    expect(evt.message).not.toContain(sensitive);
  });

  it('masque les données sensibles dans les détails', () => {
    const sensitive = ['abc123', 'def456', 'xyz789'].join('');
    emitSystemEvent({ type: 't', severity: 'info', source: 'security', message: 'ok', details: `token=${sensitive}` });
    const [evt] = getEvents();
    expect(evt.details ?? '').not.toContain(sensitive);
  });

  it('aucune télémétrie externe — pas de fetch dans emitSystemEvent', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    emit();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
