import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ObservabilityPanel } from '@/components/observability/ObservabilityPanel';
import type { ObservabilityOverview, ObservabilityStatus } from '@/lib/types';

function jsonResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

const EMPTY_SNAPSHOTS = { snapshots: [], total: 0 };
const EMPTY_STATS = { total: 0, okCount: 0, warningCount: 0, errorCount: 0, lastStatus: null, lastCreatedAt: null, statusChanges: 0, mostCommonStatus: null };
const EMPTY_TRENDS = { statusTrend: 'stable', warningFrequency: 0, errorFrequency: 0, memoryTrend: 'stable', notificationTrend: 'stable', schedulerTrend: 'stable', integrationTrend: 'stable' };

const EMPTY_TIMELINE = { items: [], summary: { total: 0, ok: 0, warning: 0, error: 0 } };

function overviewMock(status = 'ok') {
  return () => jsonResponse(overview(status as ObservabilityStatus));
}
function snapshotsMock() { return () => jsonResponse(EMPTY_SNAPSHOTS); }
function statsMock() { return () => jsonResponse(EMPTY_STATS); }
function trendsMock() { return () => jsonResponse(EMPTY_TRENDS); }
function timelineMock() { return () => jsonResponse(EMPTY_TIMELINE); }

function overview(status: ObservabilityStatus = 'ok'): ObservabilityOverview {
  return {
    status,
    phase: 18,
    backend: {
      status: 'ok',
      uptimeSeconds: 120,
      nodeVersion: 'v22.11.0',
      memoryUsed: '50 MB',
      memoryTotal: '80 MB',
      port: 3000,
      apiHealthAvailable: true,
      localOnly: true,
    },
    frontend: {
      status: 'expected',
      expectedHost: 'localhost',
      expectedPort: 3001,
      expectedUrl: 'http://localhost:3001',
      apiCacheDisabled: true,
    },
    integrations: {},
    scheduler: {
      status: 'ok',
      enabled: true,
      totalSchedules: 2,
      activeSchedules: 1,
      allowedActions: 10,
      blockedActions: 8,
      snapshotAllowed: true,
      sensitiveActionsBlocked: true,
    },
    notifications: {
      status: 'ok',
      enabled: true,
      total: 3,
      unread: 0,
      lastNotificationAt: null,
    },
    security: {
      status,
      summary: { total: 11, ok: status === 'ok' ? 11 : 9, warning: status === 'ok' ? 0 : 2 },
      localOnly: true,
      secretsMasked: true,
      sensitiveActionsBlocked: true,
    },
    runtime: {
      status: 'ok',
      runtimeJsonFiles: 2,
      directories: {
        runtime: {
          name: 'runtime',
          exists: true,
          fileCount: 2,
          jsonFileCount: 2,
          gitkeepPresent: true,
          totalSize: '4 KB',
        },
      },
      latestPortableZip: {
        present: true,
        name: 'Sallon-ConnecT-Portable.zip',
        size: '1 MB',
        modifiedAt: '2026-05-17T00:00:00.000Z',
      },
      contentHidden: true,
    },
    tests: {
      status: 'ok',
      scripts: {
        test: true,
        'test:backend': true,
        'test:frontend': true,
        'test:packaging': true,
        'test:windows': true,
        'build:frontend': true,
        check: true,
      },
      missingScripts: [],
      missingFiles: [],
      apiRunsTests: false,
    },
    logs: {
      status: 'ok',
      count: 1,
      files: [{ name: 'npm-audit-root.json', size: '1 KB', modifiedAt: '2026-05-17T00:00:00.000Z' }],
      contentHidden: true,
    },
    safety: {
      localOnly: true,
      secretsMasked: true,
      noCloudTelemetry: true,
      sensitiveActionsBlocked: true,
      apiCacheDisabled: true,
      runtimeContentHidden: true,
    },
    lastUpdatedAt: '2026-05-17T00:00:00.000Z',
  };
}

function diagnosticsMock() {
  return () => jsonResponse({
    timestamp: new Date().toISOString(),
    status: 'ok',
    uptime: 120,
    nodeVersion: 'v22.11.0',
    memory: { rss: 1000000, heapUsed: 500000, heapTotal: 800000 },
    scheduler: { status: 'running', running: true, activeSchedules: 1, totalSchedules: 2, tickMs: 30000, nextScheduled: null },
    backup: { enabled: true, count: 1, latest: null },
    notifications: { total: 0, unread: 0 },
    sse: { clients: 0 },
    security: { localOnly: true, firebase: false, cloudServices: false, externalPush: false },
  });
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function mountMock(overviewResponder: () => Promise<Response> = overviewMock('ok')) {
  return vi.fn((input: RequestInfo | URL) => {
    const url = requestUrl(input);
    if (url.includes('/api/observability/snapshots/stats')) return statsMock()();
    if (url.includes('/api/observability/snapshots/trends')) return trendsMock()();
    if (url.includes('/api/observability/snapshots/timeline')) return timelineMock()();
    if (url.includes('/api/observability/snapshots')) return snapshotsMock()();
    if (url.includes('/api/diagnostics/overview')) return diagnosticsMock()();
    if (url.includes('/api/observability/overview')) return overviewResponder();
    return jsonResponse({});
  });
}

describe('ObservabilityPanel', () => {
  it('renders loading state', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));

    render(<ObservabilityPanel />);

    expect(await screen.findByText(/Chargement observabilite/i)).toBeInTheDocument();
  });

  it('renders status ok from mocked API response', async () => {
    vi.stubGlobal('fetch', mountMock(overviewMock('ok')));

    render(<ObservabilityPanel />);

    await waitFor(() => {
      expect(screen.getByText('Observabilite globale')).toBeInTheDocument();
      expect(screen.getAllByText('OK').length).toBeGreaterThan(0);
      expect(screen.getByText('Health')).toBeInTheDocument();
    });
  });

  it.each(['warning', 'error'] as ObservabilityStatus[])('renders status %s', async (status) => {
    vi.stubGlobal('fetch', mountMock(overviewMock(status)));

    render(<ObservabilityPanel />);

    await waitFor(() => {
      expect(screen.getAllByText(status === 'warning' ? 'Warning' : 'Error').length).toBeGreaterThan(0);
    });
  });

  it('refreshes when the button is clicked', async () => {
    let overviewCalls = 0;
    const fetchMock = mountMock(() => {
      overviewCalls += 1;
      return jsonResponse(overview(overviewCalls === 1 ? 'ok' : 'warning'));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ObservabilityPanel />);

    await screen.findByText('Observabilite globale');
    fireEvent.click(screen.getAllByRole('button', { name: /Actualiser/i })[0]);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(7));
  });

  it('does not display secret-like values from mocked payloads', async () => {
    const unsafe = overview('ok');
    const token = ['abcdefghijkl', 'mnopqrstuvwxyz', '123456'].join('');
    unsafe.runtime.latestPortableZip.name =
      `Bearer ${token} token=${token} C:\\Example\\secret.txt`;
    vi.stubGlobal('fetch', mountMock(() => jsonResponse(unsafe)));

    render(<ObservabilityPanel />);

    await screen.findByText('Observabilite globale');
    expect(screen.queryByText(/abcdefghijklmnopqrstuvwxyz123456/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bearer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/C:\\Example/i)).not.toBeInTheDocument();
  });
});
