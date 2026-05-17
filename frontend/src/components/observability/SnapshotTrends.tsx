import type { SnapshotTrends } from '@/lib/types';

interface SnapshotTrendsProps {
  trends: SnapshotTrends | null;
}

const TREND_COLOR: Record<string, string> = {
  stable:      'text-slate-300',
  improving:   'text-emerald-300',
  degrading:   'text-red-300',
  increasing:  'text-yellow-300',
  decreasing:  'text-emerald-300',
  intermittent:'text-yellow-300',
};

function TrendItem({ label, value }: { label: string; value: string }) {
  const color = TREND_COLOR[value] || 'text-slate-300';
  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-sm font-semibold capitalize ${color}`}>{value}</p>
    </div>
  );
}

export function SnapshotTrends({ trends }: SnapshotTrendsProps) {
  if (!trends) {
    return <p className="text-xs text-slate-500">Chargement des tendances...</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TrendItem label="Tendance globale" value={trends.statusTrend} />
        <TrendItem label="Tendance memoire" value={trends.memoryTrend} />
        <TrendItem label="Tendance notifications" value={trends.notificationTrend} />
        <TrendItem label="Tendance scheduler" value={trends.schedulerTrend} />
      </div>
      <div className="flex flex-wrap gap-4 rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Freq. warning</p>
          <p className="mt-1 text-sm font-bold text-yellow-300">{trends.warningFrequency}%</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Freq. error</p>
          <p className="mt-1 text-sm font-bold text-red-300">{trends.errorFrequency}%</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Integrations</p>
          <p className={`mt-1 text-sm font-bold capitalize ${TREND_COLOR[trends.integrationTrend] || 'text-slate-300'}`}>
            {trends.integrationTrend}
          </p>
        </div>
      </div>
    </div>
  );
}
