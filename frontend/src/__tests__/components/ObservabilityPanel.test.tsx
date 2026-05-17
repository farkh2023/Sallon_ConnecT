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

describe('ObservabilityPanel', () => {
  it('renders loading state', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));

    render(<ObservabilityPanel />);

    expect(await screen.findByText(/Chargement observabilite/i)).toBeInTheDocument();
  });

  it('renders status ok from mocked API response', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse(overview('ok'))));

    render(<ObservabilityPanel />);

    await waitFor(() => {
      expect(screen.getByText('Observabilite globale')).toBeInTheDocument();
      expect(screen.getAllByText('OK').length).toBeGreaterThan(0);
      expect(screen.getByText('Health')).toBeInTheDocument();
    });
  });

  it.each(['warning', 'error'] as ObservabilityStatus[])('renders status %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse(overview(status))));

    render(<ObservabilityPanel />);

    await waitFor(() => {
      expect(screen.getAllByText(status === 'warning' ? 'Warning' : 'Error').length).toBeGreaterThan(0);
    });
  });

  it('refreshes when the button is clicked', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => jsonResponse(overview('ok')))
      .mockImplementationOnce(() => jsonResponse(overview('warning')));
    vi.stubGlobal('fetch', fetchMock);

    render(<ObservabilityPanel />);

    await screen.findByText('Observabilite globale');
    fireEvent.click(screen.getByRole('button', { name: /Actualiser/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('does not display secret-like values from mocked payloads', async () => {
    const unsafe = overview('ok');
    unsafe.runtime.latestPortableZip.name =
      'Bearer abcdefghijklmnopqrstuvwxyz123456 token=abcdefghijklmnopqrstuvwxyz123456 C:\\Users\\Youss\\secret.txt';
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse(unsafe)));

    render(<ObservabilityPanel />);

    await screen.findByText('Observabilite globale');
    expect(screen.queryByText(/abcdefghijklmnopqrstuvwxyz123456/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bearer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/C:\\Users/i)).not.toBeInTheDocument();
  });
});
