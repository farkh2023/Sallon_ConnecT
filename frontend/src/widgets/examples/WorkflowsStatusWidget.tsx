'use client';

import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps } from '../core/widgetTypes';
import type { WorkflowsListResponse } from '@/lib/types';

export function WorkflowsStatusWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<WorkflowsListResponse>('/api/ai/workflows');

  const activeCount = data?.workflows.filter(w => w.enabled).length ?? 0;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Workflows IA</span>
        <button
          type="button"
          onClick={() => void refresh()}
          aria-label="Actualiser statut workflows"
          className="text-[10px] text-slate-600 hover:text-slate-400"
        >
          ↻
        </button>
      </div>

      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate" role="alert">{error}</p>}

      {!loading && !error && !data && (
        <p className="text-xs text-slate-600">Aucun workflow disponible.</p>
      )}

      {data && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${activeCount > 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} aria-hidden />
            <span className="text-sm font-semibold text-slate-200">
              {activeCount} / {data.total} actifs
            </span>
          </div>
          {size !== 'small' && (
            <div className="flex flex-wrap gap-1">
              {data.workflows.slice(0, 4).map(w => (
                <span key={w.id} className={`rounded px-1.5 py-0.5 text-[10px] ${
                  w.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-600'
                }`}>
                  {w.name}
                </span>
              ))}
            </div>
          )}
          <span className="inline-block rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-400">dry-run</span>
        </div>
      )}
    </div>
  );
}
