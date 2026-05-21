import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useServerEventsStream } from '@/hooks/useServerEventsStream';
import { clearAllEvents, getEvents } from '@/lib/systemEventBus';

/* -----------------------------------------------
   Mock EventSource — static property avoids this-alias lint rule
----------------------------------------------- */
class MockEventSource {
  static latest: MockEventSource | null = null;
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  readyState = MockEventSource.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  url: string;
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.latest = this;
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
    this.closed = true;
  }

  _open() {
    this.readyState = MockEventSource.OPEN;
    this.onopen?.();
  }

  _message(data: object) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  _error() {
    this.onerror?.(new Event('error'));
  }
}

beforeEach(() => {
  MockEventSource.latest = null;
  localStorage.clear();
  clearAllEvents();
  vi.stubGlobal('EventSource', MockEventSource);
});

afterEach(() => {
  clearAllEvents();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useServerEventsStream — état initial', () => {
  it('démarre en état connecting quand EventSource est disponible', () => {
    const { result } = renderHook(() => useServerEventsStream());
    expect(result.current.state).toBe('connecting');
  });

  it('démarre en état disabled quand disabled=true', () => {
    const { result } = renderHook(() => useServerEventsStream({ disabled: true }));
    expect(result.current.state).toBe('disabled');
    expect(MockEventSource.latest).toBeNull();
  });

  it('ne crée pas d\'EventSource si disabled', () => {
    renderHook(() => useServerEventsStream({ disabled: true }));
    expect(MockEventSource.latest).toBeNull();
  });
});

describe('useServerEventsStream — transitions d\'état', () => {
  it('open event → état open', async () => {
    const { result } = renderHook(() => useServerEventsStream());
    await act(async () => { MockEventSource.latest?._open(); });
    expect(result.current.state).toBe('open');
  });

  it('error event → état error', async () => {
    const { result } = renderHook(() => useServerEventsStream());
    await act(async () => { MockEventSource.latest?._error(); });
    expect(result.current.state).toBe('error');
  });

  it('unmount → close() appelé sur EventSource', () => {
    const { unmount } = renderHook(() => useServerEventsStream());
    const instance = MockEventSource.latest;
    unmount();
    expect(instance?.closed).toBe(true);
  });
});

describe('useServerEventsStream — injection dans systemEventBus', () => {
  it('message SSE → événement ajouté dans le bus', async () => {
    renderHook(() => useServerEventsStream());
    await act(async () => {
      MockEventSource.latest?._open();
      MockEventSource.latest?._message({
        id: 'srv_test_001',
        type: 'backend.online',
        severity: 'success',
        source: 'backend',
        message: 'Backend en ligne via SSE',
      });
    });
    expect(getEvents().some((e) => e.message.includes('Backend en ligne via SSE'))).toBe(true);
  });

  it('message dupliqué (même id) n\'est pas ajouté une deuxième fois', async () => {
    renderHook(() => useServerEventsStream());
    const payload = {
      id: 'srv_dup_001',
      type: 'test.event',
      severity: 'info',
      source: 'backend',
      message: 'Événement dupliqué',
    };
    await act(async () => {
      MockEventSource.latest?._open();
      MockEventSource.latest?._message(payload);
      MockEventSource.latest?._message(payload);
    });
    expect(getEvents().filter((e) => e.message.includes('Événement dupliqué'))).toHaveLength(1);
  });

  it('heartbeat SSE n\'est pas injecté dans le bus', async () => {
    renderHook(() => useServerEventsStream());
    await act(async () => {
      MockEventSource.latest?._open();
      MockEventSource.latest?._message({
        id: 'srv_hb_123',
        type: 'sse.heartbeat',
        severity: 'info',
        source: 'backend',
        message: 'heartbeat',
      });
    });
    expect(getEvents().filter((e) => e.type === 'sse.heartbeat')).toHaveLength(0);
  });

  it('message malformé n\'est pas injecté et ne lève pas d\'erreur', async () => {
    const { result } = renderHook(() => useServerEventsStream());
    await act(async () => {
      MockEventSource.latest?._open();
      MockEventSource.latest?.onmessage?.({ data: 'pas-du-json{{{' });
    });
    expect(result.current.state).not.toBe('error');
    expect(getEvents()).toHaveLength(0);
  });

  it('message sans id est ignoré', async () => {
    renderHook(() => useServerEventsStream());
    await act(async () => {
      MockEventSource.latest?._open();
      MockEventSource.latest?._message({
        type: 'test',
        message: 'sans id',
        severity: 'info',
        source: 'backend',
      });
    });
    expect(getEvents()).toHaveLength(0);
  });
});

describe('useServerEventsStream — sécurité', () => {
  it('aucun appel fetch lors de la connexion SSE', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderHook(() => useServerEventsStream());
    await act(async () => { MockEventSource.latest?._open(); });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
