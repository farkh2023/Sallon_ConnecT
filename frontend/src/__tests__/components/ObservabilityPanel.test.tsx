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

function overviewMock(status = 'ok') {
  return () => jsonResponse(overview(status as ObservabilityStatus));
}
function snapshotsMock() { return () => jsonResponse(EMPTY_SNAPSHOTS); }
function statsMock() { return () => jsonResponse(EMPTY_STATS); }
function trendsMock() { return () => jsonResponse(EMPTY_TRENDS); }

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

// On mount the component makes 4 fetch calls in order:
// 1: loadSnapshots, 2: loadSnapshotStats, 3: loadSnapshotTrends, 4: refresh(overview)
function mountMock(...overrides: Array<() => Promise<Response>>) {
  return vi.fn()
    .mockImplementationOnce(snapshotsMock())
    .mockImplementationOnce(statsMock())
    .mockImplementationOnce(trendsMock())
    .mockImplementation(overrides[0] ?? overviewMock('ok'));
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
    const fetchMock = vi.fn()
      .mockImplementationOnce(snapshotsMock())
      .mockImplementationOnce(statsMock())
      .mockImplementationOnce(trendsMock())
      .mockImplementationOnce(overviewMock('ok'))
      .mockImplementationOnce(overviewMock('warning'));
    vi.stubGlobal('fetch', fetchMock);

    render(<ObservabilityPanel />);

    await screen.findByText('Observabilite globale');
    fireEvent.click(screen.getAllByRole('button', { name: /Actualiser/i })[0]);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5));
  });

  it('does not display secret-like values from mocked payloads', async () => {
    const unsafe = overview('ok');
    unsafe.runtime.latestPortableZip.name =
      'Bearer abcdefghijklmnopqrstuvwxyz123456 token=abcdefghijklmnopqrstuvwxyz123456 C:\\Users\\Youss\\secret.txt';
    vi.stubGlobal('fetch', mountMock(() => jsonResponse(unsafe)));

    render(<ObservabilityPanel />);

    await screen.findByText('Observabilite globale');
    expect(screen.queryByText(/abcdefghijklmnopqrstuvwxyz123456/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bearer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/C:\\Users/i)).not.toBeInTheDocument();
  });
});
