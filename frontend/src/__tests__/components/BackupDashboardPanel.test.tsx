import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BackupDashboardPanel } from '@/components/backups/BackupDashboardPanel';

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

const MOCK_SAFETY = {
  localOnly: true,
  noCloud: true,
  restoreRequiresManualConfirmation: true,
  deleteRequiresConfirmation: true,
  secretsExcluded: true,
  envExcluded: true,
  nodeModulesExcluded: true,
  pathsMasked: true,
};

const MOCK_DASHBOARD = {
  status: 'ok',
  phase: 41,
  summary: {
    total: 1,
    valid: 1,
    corrupted: 0,
    incomplete: 0,
    quick: 1,
    full: 0,
    totalSizeLabel: '200 KB',
    lastBackupAt: '2024-01-01T12:00:00.000Z',
  },
  items: [
    {
      id: '20240101-120000',
      timestamp: '2024-01-01T12:00:00.000Z',
      type: 'quick',
      description: 'Test snapshot',
      fileCount: 5,
      totalSizeKB: 200,
      valid: true,
      hasChecksum: true,
      hasReport: true,
    },
  ],
  diagnostic: null,
  safety: MOCK_SAFETY,
};

function setupFetch(...responses: unknown[]) {
  const mock = vi.fn();
  responses.forEach(r => mock.mockImplementationOnce(() => jsonResponse(r)));
  mock.mockImplementation(() => jsonResponse({ ok: true }));
  vi.stubGlobal('fetch', mock);
  return mock;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('BackupDashboardPanel', () => {
  it('renders summary cards after load', async () => {
    setupFetch(MOCK_DASHBOARD, MOCK_SAFETY);
    render(<BackupDashboardPanel />);
    await waitFor(() => {
      expect(screen.getByText('Total')).toBeDefined();
      expect(screen.getByText('Valides')).toBeDefined();
    });
  });

  it('shows snapshot id in the list', async () => {
    setupFetch(MOCK_DASHBOARD, MOCK_SAFETY);
    render(<BackupDashboardPanel />);
    await waitFor(() => {
      expect(screen.getByText('20240101-120000')).toBeDefined();
    });
  });

  it('shows Backup rapide and Backup complet buttons', async () => {
    setupFetch(MOCK_DASHBOARD, MOCK_SAFETY);
    render(<BackupDashboardPanel />);
    await waitFor(() => {
      expect(screen.getByText('Backup rapide')).toBeDefined();
      expect(screen.getByText('Backup complet')).toBeDefined();
    });
  });

  it('shows safety notice', async () => {
    setupFetch(MOCK_DASHBOARD, MOCK_SAFETY);
    render(<BackupDashboardPanel />);
    await waitFor(() => {
      expect(screen.getByText(/100% local/i)).toBeDefined();
    });
  });

  it('does not show C:\\Users\\ paths', async () => {
    setupFetch(MOCK_DASHBOARD, MOCK_SAFETY);
    const { container } = render(<BackupDashboardPanel />);
    await waitFor(() => {
      expect(screen.getByText('Total')).toBeDefined();
    });
    expect(container.innerHTML).not.toMatch(/C:\\Users\\/i);
  });

  it('shows empty state when no items', async () => {
    const emptyDash = { ...MOCK_DASHBOARD, items: [], summary: { ...MOCK_DASHBOARD.summary, total: 0 } };
    setupFetch(emptyDash, MOCK_SAFETY);
    render(<BackupDashboardPanel />);
    await waitFor(() => {
      expect(screen.getByText(/Aucun snapshot/i)).toBeDefined();
    });
  });
});
