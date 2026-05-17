'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { useObservability } from '@/hooks/useObservability';
import { formatDate } from '@/lib/format';
import { HealthOverview } from './HealthOverview';
import { LogsOverview } from './LogsOverview';
import { RuntimeOverview } from './RuntimeOverview';
import { SecurityOverview } from './SecurityOverview';
import { TestsOverview } from './TestsOverview';
import { ObservabilityStatusBadge } from './ObservabilityStatusBadge';

export function ObservabilityPanel() {
  const { overview, loading, error, lastRefreshedAt, refresh } = useObservability();

  if (loading && !overview) {
    return (
      <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 text-sm text-slate-400">
        Chargement observabilite...
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="rounded-lg border border-danger/25 bg-danger/10 p-4 text-sm text-red-300">
        Observabilite indisponible: {error}
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <ObservabilityStatusBadge status={overview.status} />
              <h3 className="text-lg font-semibold text-slate-100">Observabilite globale</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Dernier refresh: {formatDate(lastRefreshedAt || overview.lastUpdatedAt)}
            </p>
          </div>
          <Button type="button" variant="primary" loading={loading} onClick={() => void refresh()}>
            Actualiser
          </Button>
        </div>
        {error && <p className="mt-3 text-xs text-yellow-300">{error}</p>}
      </div>

      <PanelSection title="Health">
        <HealthOverview overview={overview} />
      </PanelSection>

      <PanelSection title="Securite">
        <SecurityOverview overview={overview} />
      </PanelSection>

      <PanelSection title="Runtime">
        <RuntimeOverview overview={overview} />
      </PanelSection>

      <PanelSection title="Tests">
        <TestsOverview overview={overview} />
      </PanelSection>

      <PanelSection title="Logs">
        <LogsOverview overview={overview} />
      </PanelSection>
    </div>
  );
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      {children}
    </div>
  );
}
