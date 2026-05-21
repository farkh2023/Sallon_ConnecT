import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearNotifications,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  processEvent,
  resetNotificationCenter,
  subscribeToNotificationCenter,
} from '@/lib/notificationCenter';
import type { SystemEvent } from '@/lib/types';

const NC_STORAGE_KEY = 'sallon_connect_notifications';

function makeEvent(overrides: Partial<SystemEvent> = {}): SystemEvent {
  return {
    id: `evt_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    type: 'backend.test',
    severity: 'info',
    source: 'backend',
    message: 'message test',
    read: false,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  resetNotificationCenter();
});

afterEach(() => {
  resetNotificationCenter();
  localStorage.clear();
});

describe('notificationCenter — conversion SystemEvent → LocalNotification', () => {
  it('convertit un événement info en notification', () => {
    processEvent(makeEvent({ type: 'backend.started', severity: 'info', source: 'backend', message: 'OK' }));
    const [n] = getNotifications();
    expect(n.severity).toBe('info');
    expect(n.source).toBe('backend');
    expect(n.message).toBe('OK');
    expect(n.read).toBe(false);
    expect(n.id).toMatch(/^nc_/);
    expect(n.timestamp).toBeTruthy();
  });

  it('mappe correctement les sources', () => {
    processEvent(makeEvent({ source: 'security', type: 'security.alert' }));
    expect(getNotifications()[0].source).toBe('security');

    resetNotificationCenter();
    processEvent(makeEvent({ source: 'scheduler', type: 'scheduler.run' }));
    expect(getNotifications()[0].source).toBe('scheduler');

    resetNotificationCenter();
    processEvent(makeEvent({ source: 'notifications', type: 'notifications.sent' }));
    expect(getNotifications()[0].source).toBe('system');
  });

  it('mappe le titre selon le type', () => {
    processEvent(makeEvent({ type: 'backend.error', source: 'backend' }));
    expect(getNotifications()[0].title).toBe('Backend');

    resetNotificationCenter();
    processEvent(makeEvent({ type: 'security.breach', source: 'security' }));
    expect(getNotifications()[0].title).toBe('Sécurité');

    resetNotificationCenter();
    processEvent(makeEvent({ type: 'scheduler.done', source: 'scheduler' }));
    expect(getNotifications()[0].title).toBe('Scheduler');

    resetNotificationCenter();
    processEvent(makeEvent({ type: 'unknown.event', source: 'backend' }));
    expect(getNotifications()[0].title).toBe('Système');
  });

  it('ignore les types sse.heartbeat, sse.connected, sse.error', () => {
    processEvent(makeEvent({ type: 'sse.heartbeat' }));
    processEvent(makeEvent({ type: 'sse.connected' }));
    processEvent(makeEvent({ type: 'sse.error' }));
    expect(getNotifications().length).toBe(0);
  });
});

describe('notificationCenter — déduplication', () => {
  it('ignore un événement déjà vu par id', () => {
    const evt = makeEvent();
    processEvent(evt);
    processEvent(evt);
    expect(getNotifications().length).toBe(1);
  });

  it('traite des événements avec des ids distincts', () => {
    processEvent(makeEvent({ id: 'id-a', type: 'backend.a' }));
    processEvent(makeEvent({ id: 'id-b', type: 'network.b' }));
    expect(getNotifications().length).toBe(2);
  });
});

describe('notificationCenter — regroupement', () => {
  it('incrémente count pour le même type dans la fenêtre de 5 min', () => {
    const type = 'backend.retry';
    processEvent(makeEvent({ id: 'a', type }));
    processEvent(makeEvent({ id: 'b', type }));
    processEvent(makeEvent({ id: 'c', type }));
    const notifs = getNotifications();
    expect(notifs.length).toBe(1);
    expect(notifs[0].count).toBe(3);
  });

  it('ne regroupe pas si la notification existante est lue', () => {
    const type = 'backend.retry';
    processEvent(makeEvent({ id: 'a', type }));
    markNotificationRead(getNotifications()[0].id);
    processEvent(makeEvent({ id: 'b', type }));
    expect(getNotifications().length).toBe(2);
  });

  it('ne regroupe pas des types différents', () => {
    processEvent(makeEvent({ id: 'a', type: 'backend.ok' }));
    processEvent(makeEvent({ id: 'b', type: 'network.error' }));
    expect(getNotifications().length).toBe(2);
  });

  it('stocke les relatedEventIds', () => {
    const type = 'scheduler.run';
    processEvent(makeEvent({ id: 'x1', type }));
    processEvent(makeEvent({ id: 'x2', type }));
    const n = getNotifications()[0];
    expect(n.relatedEventIds).toContain('x1');
    expect(n.relatedEventIds).toContain('x2');
  });
});

describe('notificationCenter — compteur non lus', () => {
  it('comptabilise les notifications non lues', () => {
    processEvent(makeEvent({ id: 'a', type: 'backend.a' }));
    processEvent(makeEvent({ id: 'b', type: 'network.b' }));
    expect(getUnreadCount()).toBe(2);
  });

  it('markNotificationRead marque comme lue', () => {
    processEvent(makeEvent({ id: 'a', type: 'backend.ok' }));
    const id = getNotifications()[0].id;
    markNotificationRead(id);
    expect(getUnreadCount()).toBe(0);
    expect(getNotifications()[0].read).toBe(true);
  });

  it('markAllNotificationsRead marque tout', () => {
    processEvent(makeEvent({ id: 'a', type: 'backend.a' }));
    processEvent(makeEvent({ id: 'b', type: 'network.b' }));
    markAllNotificationsRead();
    expect(getUnreadCount()).toBe(0);
    expect(getNotifications().every((n) => n.read)).toBe(true);
  });
});

describe('notificationCenter — clear', () => {
  it('clearNotifications vide la liste', () => {
    processEvent(makeEvent({ id: 'a' }));
    clearNotifications();
    expect(getNotifications().length).toBe(0);
    expect(getUnreadCount()).toBe(0);
  });

  it('clearNotifications réinitialise les ids vus (permet réinjection)', () => {
    const evt = makeEvent({ id: 'reuse-id' });
    processEvent(evt);
    clearNotifications();
    processEvent(evt);
    expect(getNotifications().length).toBe(1);
  });
});

describe('notificationCenter — rétention max 100', () => {
  it('ne dépasse pas 100 notifications', () => {
    for (let i = 0; i < 120; i++) {
      processEvent(makeEvent({ id: `evt-${i}`, type: `unique.type.${i}` }));
    }
    expect(getNotifications().length).toBe(100);
  });

  it('conserve les plus récentes (LIFO)', () => {
    for (let i = 0; i < 105; i++) {
      processEvent(makeEvent({ id: `evt-${i}`, type: `unique.type.${i}` }));
    }
    const notifs = getNotifications();
    expect(notifs.length).toBe(100);
    expect(notifs[0].groupKey).toBe('unique.type.104');
  });
});

describe('notificationCenter — persistance localStorage', () => {
  it('sauvegarde dans localStorage après processEvent', () => {
    processEvent(makeEvent({ id: 'save-1', type: 'backend.ok' }));
    const raw = localStorage.getItem(NC_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
  });

  it('sauvegarde après markNotificationRead', () => {
    processEvent(makeEvent({ id: 'read-1', type: 'backend.ok' }));
    const id = getNotifications()[0].id;
    markNotificationRead(id);
    const raw = localStorage.getItem(NC_STORAGE_KEY);
    const parsed = JSON.parse(raw!);
    expect(parsed[0].read).toBe(true);
  });

  it('supprime la clé après clearNotifications', () => {
    processEvent(makeEvent({ id: 'clear-1', type: 'backend.ok' }));
    clearNotifications();
    expect(localStorage.getItem(NC_STORAGE_KEY)).toBeNull();
  });
});

describe('notificationCenter — sécurité', () => {
  it('masque les Bearer tokens dans les messages', () => {
    const sensitive = ['abc123', 'defghij', 'klmnop'].join('');
    processEvent(makeEvent({
      id: 'secret-1',
      type: 'backend.auth',
      message: `Authorization: Bearer ${sensitive}`,
    }));
    const n = getNotifications()[0];
    expect(n.message).not.toContain(sensitive);
    expect(n.message).toContain('[token-masque]');
  });

  it('ne déclenche aucun appel réseau', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    processEvent(makeEvent({ id: 'net-1' }));
    markNotificationRead(getNotifications()[0].id);
    clearNotifications();
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('notificationCenter — subscriptions', () => {
  it('notifie les listeners après processEvent', () => {
    const listener = vi.fn();
    const unsub = subscribeToNotificationCenter(listener);
    processEvent(makeEvent({ id: 'sub-1' }));
    expect(listener).toHaveBeenCalledOnce();
    unsub();
  });

  it('arrête de notifier après désabonnement', () => {
    const listener = vi.fn();
    const unsub = subscribeToNotificationCenter(listener);
    unsub();
    processEvent(makeEvent({ id: 'sub-2' }));
    expect(listener).not.toHaveBeenCalled();
  });

  it('notifie après markAllNotificationsRead', () => {
    processEvent(makeEvent({ id: 'sub-3', type: 'backend.ok' }));
    const listener = vi.fn();
    const unsub = subscribeToNotificationCenter(listener);
    markAllNotificationsRead();
    expect(listener).toHaveBeenCalledOnce();
    unsub();
  });

  it('notifie après clearNotifications', () => {
    processEvent(makeEvent({ id: 'sub-4', type: 'backend.ok' }));
    const listener = vi.fn();
    const unsub = subscribeToNotificationCenter(listener);
    clearNotifications();
    expect(listener).toHaveBeenCalledOnce();
    unsub();
  });
});
