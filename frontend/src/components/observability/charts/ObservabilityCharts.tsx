'use client';

import { useState } from 'react';
import type { SnapshotChartFilters, SnapshotTimelineResponse } from '@/lib/types';
import { SnapshotFilters } from './SnapshotFilters';
import { StatusTimelineChart } from './StatusTimelineChart';
import { NotificationsTrendChart } from './NotificationsTrendChart';
import { IntegrationsTrendChart } from './IntegrationsTrendChart';
import { ScoreRadarChart } from './ScoreRadarChart';
import { SnapshotTimelineTable } from './SnapshotTimelineTable';

interface ObservabilityChartsProps {
  timeline: SnapshotTimelineResponse | null;
  timelineLoading: boolean;
  timelineError: string | null;
  onLoadTimeline: (filters?: SnapshotChartFilters) => Promise<void>;
  onExportJson: () => void;
  onExportCsv: () => void;
}

export function ObservabilityCharts({
  timeline,
  timelineLoading,
  timelineError,
  onLoadTimeline,
  onExportJson,
  onExportCsv,
}: ObservabilityChartsProps) {
  const [filters, setFilters] = useState<SnapshotChartFilters>({ limit: 50 });

  const handleFiltersChange = (next: SnapshotChartFilters) => {
    setFilters(next);
  };

  const handleRefresh = () => {
    void onLoadTimeline(filters);
  };

  const items = timeline?.items ?? [];
  const summary = timeline?.summary ?? null;
  const latestItem = items.length > 0 ? items[0] : null;

  if (!timeline && !timelineLoading && !timelineError) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        Aucun snapshot disponible. Créez un snapshot pour générer les graphes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SnapshotFilters
        filters={filters}
        onChange={handleFiltersChange}
        onRefresh={handleRefresh}
        onExportJson={onExportJson}
        onExportCsv={onExportCsv}
        loading={timelineLoading}
      />

      {timelineError && (
        <p className="text-red-400 text-sm px-1">{timelineError}</p>
      )}

      {summary && (
        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
          <span>Total : <strong className="text-gray-200">{summary.total}</strong></span>
          <span className="text-green-400">OK : {summary.ok}</span>
          <span className="text-yellow-400">Warning : {summary.warning}</span>
          <span className="text-red-400">Error : {summary.error}</span>
        </div>
      )}

      {items.length === 0 && !timelineLoading && (
        <p className="text-sm text-gray-500 text-center py-6">
          Aucun snapshot disponible. Créez un snapshot pour générer les graphes.
        </p>
      )}

      {items.length > 0 && (
        <>
          <section>
            <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2 tracking-wider">
              Statut dans le temps
            </h4>
            <StatusTimelineChart items={items} />
          </section>

          {latestItem && (
            <section>
              <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2 tracking-wider">
                Dernier snapshot — scores globaux
              </h4>
              <ScoreRadarChart item={latestItem} />
            </section>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <section>
              <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2 tracking-wider">
                Tendance notifications
              </h4>
              <NotificationsTrendChart items={items} />
            </section>

            <section>
              <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2 tracking-wider">
                Tendance intégrations
              </h4>
              <IntegrationsTrendChart items={items} />
            </section>
          </div>

          <section>
            <h4 className="text-xs font-semibold uppercase text-gray-400 mb-2 tracking-wider">
              Historique compact
            </h4>
            <SnapshotTimelineTable items={items} />
          </section>
        </>
      )}
    </div>
  );
}
