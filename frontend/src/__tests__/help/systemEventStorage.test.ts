import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RETENTION_MAX,
  STORAGE_KEY,
  clearStoredEvents,
  isStorageAvailable,
  loadEvents,
  saveEvents,
} from '@/lib/systemEventStorage';
import type { SystemEvent } from '@/lib/types';

function makeEvent(overrides: Partial<SystemEvent> = {}): SystemEvent {
  return {
    id: `evt_test_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    type: 'test',
    severity: 'info',
    source: 'backend',
    message: 'test',
    read: false,
    ...overrides,
  };
}

beforeEach(() => { localStorage.clear(); });
afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

describe('isStorageAvailable', () => {
  it('retourne true dans un environnement jsdom', () => {
    expect(isStorageAvailable()).toBe(true);
  });

  it('retourne false si localStorage.setItem lève une erreur', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(isStorageAvailable()).toBe(false);
  });
});

describe('loadEvents', () => {
  it('retourne [] si rien dans localStorage', () => {
    expect(loadEvents()).toEqual([]);
  });

  it('charge les événements sauvegardés', () => {
    const events = [makeEvent({ message: 'hello' })];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    const loaded = loadEvents();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].message).toBe('hello');
  });

  it('ignore les entrées invalides (champs manquants)', () => {
    const mixed = [makeEvent({ message: 'valid' }), { notAnEvent: true }, null, 42];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mixed));
    const loaded = loadEvents();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].message).toBe('valid');
  });

  it('filtre les événements plus vieux que 7 jours', () => {
    const old = makeEvent({
      timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      message: 'ancien',
    });
    const fresh = makeEvent({ message: 'récent' });
    localStorage.setItem(STORAGE_KEY, JSON.stringify([old, fresh]));
    const loaded = loadEvents();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].message).toBe('récent');
  });

  it('limite à RETENTION_MAX événements', () => {
    const events = Array.from({ length: 250 }, (_, i) => makeEvent({ message: `evt-${i}` }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    expect(loadEvents()).toHaveLength(RETENTION_MAX);
  });

  it('retourne [] si le contenu JSON est invalide', () => {
    localStorage.setItem(STORAGE_KEY, 'pas-du-json{{{');
    expect(loadEvents()).toEqual([]);
  });

  it('retourne [] si le JSON est un scalaire (pas un tableau)', () => {
    localStorage.setItem(STORAGE_KEY, '"chaine"');
    expect(loadEvents()).toEqual([]);
  });

  it('retourne [] si localStorage.getItem lève une erreur', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(loadEvents()).toEqual([]);
  });
});

describe('saveEvents', () => {
  it('sauvegarde les événements dans localStorage', () => {
    const events = [makeEvent({ message: 'saved' })];
    saveEvents(events);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as SystemEvent[];
    expect(parsed[0].message).toBe('saved');
  });

  it('tronque à RETENTION_MAX événements', () => {
    const events = Array.from({ length: 250 }, (_, i) => makeEvent({ message: `evt-${i}` }));
    saveEvents(events);
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as SystemEvent[];
    expect(parsed).toHaveLength(RETENTION_MAX);
  });

  it('ne lève pas d\'erreur si localStorage.setItem échoue (QuotaExceeded)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveEvents([makeEvent()])).not.toThrow();
  });

  it('ne sauvegarde pas si localStorage indisponible', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    saveEvents([makeEvent()]);
    vi.restoreAllMocks();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('clearStoredEvents', () => {
  it('supprime la clé de localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([makeEvent()]));
    clearStoredEvents();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('ne lève pas d\'erreur si la clé n\'existe pas', () => {
    expect(() => clearStoredEvents()).not.toThrow();
  });
});

describe('systemEventStorage — sécurité', () => {
  it('aucun appel réseau lors des opérations de stockage', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    saveEvents([makeEvent()]);
    loadEvents();
    clearStoredEvents();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('les données masquées sont préservées telles quelles au chargement', () => {
    const event = makeEvent({ message: 'Bearer [token-masque]' });
    saveEvents([event]);
    const loaded = loadEvents();
    expect(loaded[0].message).toBe('Bearer [token-masque]');
  });
});
