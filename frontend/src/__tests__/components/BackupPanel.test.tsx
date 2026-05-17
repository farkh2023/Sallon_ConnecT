import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BackupPanel } from '@/components/backup/BackupPanel';

function jsonResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

const EMPTY_STATUS = {
  enabled: true,
  backupDirMasked: '…/backups',
  maxItems: 20,
  rollbackEnabled: true,
  dryRunRequired: true,
  confirmationRequired: true,
  count: 0,
  latest: null,
};

const EMPTY_BACKUPS = { backups: [] };
const EMPTY_AUDIT = { audit: [] };

function setupFetch(...responses: unknown[]) {
  const mock = vi.fn();
  responses.forEach(r => mock.mockImplementationOnce(() => jsonResponse(r)));
  mock.mockImplementation(() => jsonResponse({}));
  vi.stubGlobal('fetch', mock);
  return mock;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('BackupPanel', () => {
  it('renders safety notice', async () => {
    setupFetch(EMPTY_STATUS, EMPTY_BACKUPS, EMPTY_AUDIT);
    render(<BackupPanel />);
    await waitFor(() => {
      expect(screen.getByText(/100.*local/i)).toBeTruthy();
    });
  });

  it('renders backup status', async () => {
    setupFetch(EMPTY_STATUS, EMPTY_BACKUPS, EMPTY_AUDIT);
    render(<BackupPanel />);
    await waitFor(() => {
      expect(screen.getByText(/active/i)).toBeTruthy();
    });
  });

  it('shows empty backups message', async () => {
    setupFetch(EMPTY_STATUS, EMPTY_BACKUPS, EMPTY_AUDIT);
    render(<BackupPanel />);
    await waitFor(() => {
      expect(screen.getByText(/aucune sauvegarde/i)).toBeTruthy();
    });
  });

  it('renders create backup button', async () => {
    setupFetch(EMPTY_STATUS, EMPTY_BACKUPS, EMPTY_AUDIT);
    render(<BackupPanel />);
    await waitFor(() => {
      expect(screen.getByText(/créer sauvegarde/i)).toBeTruthy();
    });
  });

  it('shows dry-run button when backup exists', async () => {
    const withBackup = {
      backups: [{
        backupId: 'backup_123456_abc',
        fileName: 'backup_123456_abc.zip',
        filePath: '…/backups/backup_123456_abc.zip',
        createdAt: '2026-05-17T10:00:00.000Z',
        summary: { fileCount: 5, totalSizeBucket: 'small', runtimeIncluded: true, auditsIncluded: false, logsIncluded: false },
        checksumPresent: true,
      }],
    };
    setupFetch(EMPTY_STATUS, withBackup, EMPTY_AUDIT);
    render(<BackupPanel />);
    await waitFor(() => {
      expect(screen.getByText(/dry-run/i)).toBeTruthy();
    });
  });

  it('restore button is disabled without confirmation code', async () => {
    setupFetch(EMPTY_STATUS, EMPTY_BACKUPS, EMPTY_AUDIT);
    render(<BackupPanel />);
    await waitFor(() => {
      expect(screen.getByText(/sauvegarde locale/i)).toBeTruthy();
    });
    const restoreButtons = screen.queryAllByText(/restaurer/i);
    for (const btn of restoreButtons) {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it('does not display sensitive data or absolute paths', async () => {
    setupFetch(EMPTY_STATUS, EMPTY_BACKUPS, EMPTY_AUDIT);
    const { container } = render(<BackupPanel />);
    await waitFor(() => {
      expect(screen.getByText(/sauvegarde locale/i)).toBeTruthy();
    });
    expect(container.textContent).not.toMatch(/C:\\Users/);
    expect(container.textContent).not.toMatch(/node_modules/);
    expect(container.textContent).not.toMatch(/token/i);
  });
});
