import type { ObservabilityOverview } from '@/lib/types';
import { ObservabilityMetric } from './ObservabilityMetric';

interface SecurityOverviewProps {
  overview: ObservabilityOverview;
}

export function SecurityOverview({ overview }: SecurityOverviewProps) {
  const security = overview.security;
  const safety = overview.safety;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <ObservabilityMetric
        label="Checks securite"
        value={`${security.summary.ok}/${security.summary.total}`}
        detail={`${security.summary.warning} warning`}
        status={security.status}
      />
      <ObservabilityMetric label="Secrets masques" value={safety.secretsMasked} status={safety.secretsMasked ? 'ok' : 'error'} />
      <ObservabilityMetric label="Actions sensibles" value={safety.sensitiveActionsBlocked ? 'Bloquees' : 'A verifier'} status={safety.sensitiveActionsBlocked ? 'ok' : 'error'} />
      <ObservabilityMetric label="Cache API" value={safety.apiCacheDisabled ? 'Desactive' : 'Actif'} status={safety.apiCacheDisabled ? 'ok' : 'warning'} />
      <ObservabilityMetric label="Runtime" value={safety.runtimeContentHidden ? 'Masque' : 'Expose'} status={safety.runtimeContentHidden ? 'ok' : 'error'} />
      <ObservabilityMetric label="Local only" value={safety.localOnly} status={safety.localOnly ? 'ok' : 'error'} />
      <ObservabilityMetric label="Telemetrie cloud" value={safety.noCloudTelemetry ? 'Aucune' : 'Active'} status={safety.noCloudTelemetry ? 'ok' : 'error'} />
    </div>
  );
}
