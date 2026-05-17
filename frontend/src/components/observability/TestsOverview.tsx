import type { ObservabilityOverview } from '@/lib/types';
import { ObservabilityMetric, safeObservabilityText } from './ObservabilityMetric';

interface TestsOverviewProps {
  overview: ObservabilityOverview;
}

export function TestsOverview({ overview }: TestsOverviewProps) {
  const scripts = Object.entries(overview.tests.scripts || {});
  const presentCount = scripts.filter(([, present]) => present).length;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ObservabilityMetric
          label="Scripts"
          value={`${presentCount}/${scripts.length}`}
          detail="Aucune execution depuis API"
          status={overview.tests.status}
        />
        <ObservabilityMetric
          label="Manquants"
          value={overview.tests.missingScripts.length + overview.tests.missingFiles.length}
          detail="Scripts et fichiers"
          status={overview.tests.status}
        />
        <ObservabilityMetric
          label="API lance tests"
          value={overview.tests.apiRunsTests ? 'Oui' : 'Non'}
          status={overview.tests.apiRunsTests ? 'error' : 'ok'}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {scripts.map(([script, present]) => (
          <div
            key={script}
            className={`rounded-lg border px-3 py-2 text-xs ${
              present
                ? 'border-success/20 bg-success/5 text-emerald-300'
                : 'border-warning/20 bg-warning/5 text-yellow-300'
            }`}
          >
            {safeObservabilityText(script)}
          </div>
        ))}
      </div>
    </div>
  );
}
