import type { ObservabilitySnapshot, SnapshotStats, SnapshotTrends } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import { ObservabilityStatusBadge } from './ObservabilityStatusBadge';
import { SnapshotStats as SnapshotStatsPanel } from './SnapshotStats';
import { SnapshotTrends as SnapshotTrendsPanel } from './SnapshotTrends';

interface SnapshotHistoryProps {
  snapshots: ObservabilitySnapshot[];
  stats: SnapshotStats | null;
  trends: SnapshotTrends | null;
  loading: boolean;
  error: string | null;
  onCreateSnapshot: () => void;
  onClearSnapshots: () => void;
  onLoadSnapshots: () => void;
  onLoadStats: () => void;
  onLoadTrends: () => void;
}

const SOURCE_LABEL: Record<string, string> = {
  manual:    'Manuel',
  scheduler: 'Scheduler',
  startup:   'Demarrage',
};

export function SnapshotHistory({
  snapshots,
  stats,
  trends,
  loading,
  error,
  onCreateSnapshot,
  onClearSnapshots,
  onLoadSnapshots,
  onLoadStats,
  onLoadTrends,
}: SnapshotHistoryProps) {
  const latest = snapshots[0] || null;

  return (
    <div className="space-y-4">
      {/* Security notice */}
      <p className="text-xs text-slate-500">
        Securite : resumes non sensibles uniquement — aucun secret, aucun log brut, aucune IP complete.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          loading={loading}
          onClick={() => { onCreateSnapshot(); void Promise.all([onLoadStats(), onLoadTrends()]); }}
        >
          Creer snapshot
        </Button>
        <Button type="button" variant="secondary" loading={loading} onClick={() => void onLoadSnapshots()}>
          Actualiser
        </Button>
        <Button
          type="button"
          variant="danger"
          loading={loading}
          onClick={() => { onClearSnapshots(); }}
          disabled={snapshots.length === 0}
        >
          Vider historique
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-300">{error}</p>
      )}

      {/* Latest snapshot */}
      {latest && (
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <ObservabilityStatusBadge status={latest.status} />
            <span className="text-sm font-semibold text-slate-200">Dernier snapshot</span>
            <span className="text-xs text-slate-500">{SOURCE_LABEL[latest.source] || latest.source}</span>
            <span className="text-xs text-slate-500">{formatDate(latest.createdAt)}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Backend</p>
              <p className="text-sm text-slate-200">
                {latest.backend.ok ? 'OK' : 'KO'} — mem: {latest.backend.memoryBucket} — uptime: {latest.backend.uptimeBucket}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Notifications</p>
              <p className="text-sm text-slate-200">
                total: {latest.notifications.totalBucket} / non lues: {latest.notifications.unreadBucket}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Runtime</p>
              <p className="text-sm text-slate-200">
                fichiers: {latest.runtime.runtimeFilesBucket} / zip: {latest.runtime.portableZipPresent ? 'present' : 'absent'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Statistiques</h5>
          <button
            type="button"
            className="text-xs text-slate-500 underline hover:text-slate-300"
            onClick={() => void onLoadStats()}
          >
            Rafraichir
          </button>
        </div>
        <SnapshotStatsPanel stats={stats} />
      </div>

      {/* Trends */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tendances</h5>
          <button
            type="button"
            className="text-xs text-slate-500 underline hover:text-slate-300"
            onClick={() => void onLoadTrends()}
          >
            Rafraichir
          </button>
        </div>
        <SnapshotTrendsPanel trends={trends} />
      </div>

      {/* Snapshot list (last 5) */}
      {snapshots.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Historique ({snapshots.length} snapshot{snapshots.length > 1 ? 's' : ''})
          </h5>
          <div className="space-y-2">
            {snapshots.slice(0, 10).map((snap, idx) => (
              <div
                key={snap.id ?? idx}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <ObservabilityStatusBadge status={snap.status} />
                <span className="text-xs text-slate-400">{SOURCE_LABEL[snap.source] || snap.source}</span>
                <span className="text-xs text-slate-500">{formatDate(snap.createdAt)}</span>
                <span className="text-xs text-slate-500">
                  mem:{snap.backend.memoryBucket} | notifs:{snap.notifications.unreadBucket}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {snapshots.length === 0 && !loading && (
        <p className="text-xs text-slate-500">Aucun snapshot. Cliquez sur &quot;Creer snapshot&quot; pour commencer.</p>
      )}
    </div>
  );
}
