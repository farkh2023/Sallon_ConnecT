import type { ObservabilityOverview } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { ObservabilityMetric, safeObservabilityText } from './ObservabilityMetric';

interface LogsOverviewProps {
  overview: ObservabilityOverview;
}

export function LogsOverview({ overview }: LogsOverviewProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ObservabilityMetric
          label="Fichiers logs"
          value={overview.logs.count}
          detail="Contenu non expose"
          status={overview.logs.status}
        />
        <ObservabilityMetric
          label="Masquage"
          value={overview.logs.contentHidden ? 'Actif' : 'Inactif'}
          status={overview.logs.contentHidden ? 'ok' : 'error'}
        />
      </div>

      {overview.logs.files.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-white/[0.08]">
          {overview.logs.files.slice(0, 6).map((file) => (
            <div
              key={`${file.name}-${file.modifiedAt}`}
              className="grid gap-2 border-b border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-slate-400 last:border-b-0 sm:grid-cols-[1fr_auto_auto]"
            >
              <span className="break-words font-medium text-slate-300">{safeObservabilityText(file.name)}</span>
              <span>{safeObservabilityText(file.size)}</span>
              <span>{formatDate(file.modifiedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
