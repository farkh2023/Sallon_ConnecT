import type { ObservabilityOverview } from '@/lib/types';
import { ObservabilityMetric } from './ObservabilityMetric';

interface HealthOverviewProps {
  overview: ObservabilityOverview;
}

export function HealthOverview({ overview }: HealthOverviewProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <ObservabilityMetric label="Backend" value={overview.backend.status} status={overview.backend.status} />
      <ObservabilityMetric label="Node" value={overview.backend.nodeVersion} detail={overview.backend.memoryUsed} />
      <ObservabilityMetric label="Port backend" value={overview.backend.port} detail="localhost seulement" />
      <ObservabilityMetric
        label="Frontend"
        value={overview.frontend.expectedUrl}
        detail={overview.frontend.status}
      />
      <ObservabilityMetric
        label="Scheduler"
        value={`${overview.scheduler.activeSchedules}/${overview.scheduler.totalSchedules}`}
        detail={overview.scheduler.snapshotAllowed ? 'Snapshot autorise' : 'Snapshot absent'}
        status={overview.scheduler.snapshotAllowed ? 'ok' : 'warning'}
      />
      <ObservabilityMetric
        label="Notifications"
        value={overview.notifications.unread}
        detail={`${overview.notifications.total} total`}
        status={overview.notifications.status}
      />
      <ObservabilityMetric
        label="Integrations"
        value="Lecture locale"
        detail="ADB, DLNA, SmartThings, streaming"
      />
      <ObservabilityMetric
        label="Phase"
        value={overview.phase}
        detail={overview.safety.noCloudTelemetry ? 'Aucune telemetrie cloud' : 'Controle requis'}
        status={overview.safety.noCloudTelemetry ? 'ok' : 'warning'}
      />
    </div>
  );
}
