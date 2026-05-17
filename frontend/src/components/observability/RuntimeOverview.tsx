import type { ObservabilityOverview } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { ObservabilityMetric, safeObservabilityText } from './ObservabilityMetric';

interface RuntimeOverviewProps {
  overview: ObservabilityOverview;
}

export function RuntimeOverview({ overview }: RuntimeOverviewProps) {
  const directories = Object.values(overview.runtime.directories || {});
  const zip = overview.runtime.latestPortableZip;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ObservabilityMetric
          label="JSON runtime"
          value={overview.runtime.runtimeJsonFiles}
          detail="Contenu masque"
          status={overview.runtime.status}
        />
        <ObservabilityMetric
          label="ZIP portable"
          value={zip.present ? zip.name : 'Absent'}
          detail={zip.present ? `${zip.size} - ${formatDate(zip.modifiedAt)}` : undefined}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {directories.map((dir) => (
          <div key={dir.name} className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-200">{safeObservabilityText(dir.name)}</p>
              <span className="text-xs text-slate-500">{dir.exists ? 'Present' : 'Absent'}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
              <span>Fichiers: {dir.fileCount}</span>
              <span>JSON: {dir.jsonFileCount}</span>
              <span>Taille: {safeObservabilityText(dir.totalSize)}</span>
              <span>.gitkeep: {dir.gitkeepPresent ? 'oui' : 'non'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
