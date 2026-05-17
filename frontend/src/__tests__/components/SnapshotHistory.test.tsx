import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SnapshotHistory } from '@/components/observability/SnapshotHistory';
import type { ObservabilitySnapshot, SnapshotStats, SnapshotTrends } from '@/lib/types';

function makeSnapshot(status: 'ok' | 'warning' | 'error' = 'ok'): ObservabilitySnapshot {
  return {
    id: 'obs_test123',
    createdAt: '2026-05-17T21:00:00.000Z',
    source: 'manual',
    status,
    phase: 18,
    backend: { ok: true, uptimeBucket: 'medium', memoryBucket: 'low' },
    frontend: { expectedPort: 3001, configured: true },
    integrations: { adb: 'disabled', dlna: 'disabled', smartThings: 'disabled', streaming: 'disabled' },
    scheduler: { running: true, activeSchedules: 0 },
    notifications: { totalBucket: 'low', unreadBucket: 'none', securityEventsBucket: 'none' },
    security: { secretsProtected: true, runtimeHidden: true, apiCacheDisabled: true, sensitiveActionsBlocked: true },
    runtime: { runtimeFilesBucket: 'low', logsBucket: 'none', portableZipPresent: true },
  };
}

function makeStats(): SnapshotStats {
  return {
    total: 1,
    okCount: 1,
    warningCount: 0,
    errorCount: 0,
    lastStatus: 'ok',
    lastCreatedAt: '2026-05-17T21:00:00.000Z',
    statusChanges: 0,
    mostCommonStatus: 'ok',
  };
}

function makeTrends(): SnapshotTrends {
  return {
    statusTrend: 'stable',
    warningFrequency: 0,
    errorFrequency: 0,
    memoryTrend: 'stable',
    notificationTrend: 'stable',
    schedulerTrend: 'stable',
    integrationTrend: 'stable',
  };
}

const defaultProps = {
  snapshots: [],
  stats: null,
  trends: null,
  loading: false,
  error: null,
  onCreateSnapshot: vi.fn(),
  onClearSnapshots: vi.fn(),
  onLoadSnapshots: vi.fn(),
  onLoadStats: vi.fn(),
  onLoadTrends: vi.fn(),
};

describe('SnapshotHistory', () => {
  it('renders empty state', () => {
    render(<SnapshotHistory {...defaultProps} />);
    expect(screen.getByText(/Aucun snapshot/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Creer snapshot/i })).toBeInTheDocument();
  });

  it('renders a snapshot with status ok', () => {
    render(<SnapshotHistory {...defaultProps} snapshots={[makeSnapshot('ok')]} stats={makeStats()} trends={makeTrends()} />);
    expect(screen.getAllByText('OK').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dernier snapshot').length).toBeGreaterThan(0);
  });

  it('renders warning status', () => {
    render(<SnapshotHistory {...defaultProps} snapshots={[makeSnapshot('warning')]} />);
    expect(screen.getAllByText('Warning').length).toBeGreaterThan(0);
  });

  it('renders error status', () => {
    render(<SnapshotHistory {...defaultProps} snapshots={[makeSnapshot('error')]} />);
    expect(screen.getAllByText('Error').length).toBeGreaterThan(0);
  });

  it('calls onCreateSnapshot when create button is clicked', () => {
    const onCreateSnapshot = vi.fn();
    render(<SnapshotHistory {...defaultProps} onCreateSnapshot={onCreateSnapshot} />);
    fireEvent.click(screen.getByRole('button', { name: /Creer snapshot/i }));
    expect(onCreateSnapshot).toHaveBeenCalledTimes(1);
  });

  it('calls onClearSnapshots when clear button is clicked', () => {
    const onClearSnapshots = vi.fn();
    render(
      <SnapshotHistory
        {...defaultProps}
        snapshots={[makeSnapshot('ok')]}
        onClearSnapshots={onClearSnapshots}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Vider historique/i }));
    expect(onClearSnapshots).toHaveBeenCalledTimes(1);
  });

  it('does not display secret-like values', () => {
    const snap = makeSnapshot('ok');
    render(<SnapshotHistory {...defaultProps} snapshots={[snap]} />);
    expect(screen.queryByText(/Bearer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/token[:=]/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/C:\\Users/i)).not.toBeInTheDocument();
  });

  it('displays security notice', () => {
    render(<SnapshotHistory {...defaultProps} />);
    expect(screen.getByText(/resumes non sensibles uniquement/i)).toBeInTheDocument();
  });
});
