import type { SnapshotStats } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { ObservabilityStatusBadge } from './ObservabilityStatusBadge';

interface SnapshotStatsProps {
  stats: SnapshotStats | null;
}

export function SnapshotStats({ stats }: SnapshotStatsProps) {
  if (!stats) {
    return (
      <p className="text-xs text-slate-500">Chargement des statistiques...</p>
    );
  }

  if (stats.total === 0) {
    return (
      <p className="text-xs text-slate-500">Aucun snapshot enregistre.</p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="min-h-20 rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
        <p className="mt-2 text-xl font-bold text-slate-100">{stats.total}</p>
        <p className="mt-1 text-xs text-slate-500">{stats.statusChanges} changement(s) de statut</p>
      </div>

      <div className="min-h-20 rounded-lg border border-success/20 bg-success/5 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">OK</p>
        <p className="mt-2 text-xl font-bold text-emerald-300">{stats.okCount}</p>
        <p className="mt-1 text-xs text-slate-500">{stats.total ? Math.round((stats.okCount / stats.total) * 100) : 0}%</p>
      </div>

      <div className="min-h-20 rounded-lg border border-warning/20 bg-warning/5 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Warning</p>
        <p className="mt-2 text-xl font-bold text-yellow-300">{stats.warningCount}</p>
        <p className="mt-1 text-xs text-slate-500">{stats.total ? Math.round((stats.warningCount / stats.total) * 100) : 0}%</p>
      </div>

      <div className="min-h-20 rounded-lg border border-danger/20 bg-danger/5 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Error</p>
        <p className="mt-2 text-xl font-bold text-red-300">{stats.errorCount}</p>
        <p className="mt-1 text-xs text-slate-500">{stats.total ? Math.round((stats.errorCount / stats.total) * 100) : 0}%</p>
      </div>

      <div className="col-span-full rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Dernier statut</p>
            <div className="mt-1">
              {stats.lastStatus ? (
                <ObservabilityStatusBadge status={stats.lastStatus} />
              ) : (
                <span className="text-sm text-slate-400">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Dernier snapshot</p>
            <p className="mt-1 text-sm text-slate-300">{formatDate(stats.lastCreatedAt)}</p>
          </div>
          {stats.mostCommonStatus && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Statut frequent</p>
              <ObservabilityStatusBadge status={stats.mostCommonStatus} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
