import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDiagnosticsOverview } from '@/hooks/useDiagnosticsOverview';
import { clearAllEvents } from '@/lib/systemEventBus';

const DIAG_OK = {
  timestamp: '2026-05-22T00:00:00.000Z',
  status: 'ok',
  uptime: 3600,
  nodeVersion: 'v22.11.0',
  memory: { rss: 10000000, heapUsed: 5000000, heapTotal: 8000000 },
  scheduler: {
    status: 'running',
    running: true,
    activeSchedules: 2,
    totalSchedules: 3,
    tickMs: 30000,
    nextScheduled: null,
  },
  backup: { enabled: true, count: 2, latest: null },
  notifications: { total: 5, unread: 1 },
  sse: { clients: 1 },
  security: { localOnly: true, firebase: false, cloudServices: false, externalPush: false },
};

function jsonOk(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function jsonError(status = 500) {
  return Promise.resolve(
    new Response(JSON.stringify({ error: 'Internal error' }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  clearAllEvents();
});

afterEach(() => {
  clearAllEvents();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('useDiagnosticsOverview — etat initial', () => {
  it('expose loading=true sans erreur avant la reponse API', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    const { result } = renderHook(() => useDiagnosticsOverview());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });
});

describe('useDiagnosticsOverview — succes', () => {
  it('construit un snapshot complet avec backup', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonOk(DIAG_OK)));
    const { result } = renderHook(() => useDiagnosticsOverview());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.raw?.backup.count).toBe(2);
    expect(result.current.data?.backup.label).toBe('Backup');
    expect(result.current.data?.backup.status).toBe('ok');
    expect(result.current.data?.score).toBeGreaterThan(0);
  });
});

describe('useDiagnosticsOverview — erreur', () => {
  it('expose une erreur propre sans snapshot premature', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonError(503)));
    const { result } = renderHook(() => useDiagnosticsOverview());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.raw).toBeNull();
    expect(result.current.error).toMatch(/HTTP 503/);
  });
});
