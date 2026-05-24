'use client';

import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps } from '../core/widgetTypes';
import type { AgentsListResponse } from '@/lib/types';

export function AgentsStatusWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<AgentsListResponse>('/api/ai/agents');

  const activeCount = data?.agents.filter(a => a.enabled).length ?? 0;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Agents IA</span>
        <button
          type="button"
          onClick={() => void refresh()}
          aria-label="Actualiser statut agents"
          className="text-[10px] text-slate-600 hover:text-slate-400"
        >
          ↻
        </button>
      </div>

      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate" role="alert">{error}</p>}

      {!loading && !error && !data && (
        <p className="text-xs text-slate-600">Aucun agent disponible.</p>
      )}

      {data && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${activeCount > 0 ? 'bg-emerald-400' : 'bg-slate-600'}`}
              aria-hidden
            />
            <span className="text-sm font-semibold text-slate-200">
              {activeCount} / {data.total} actifs
            </span>
          </div>
          {size !== 'small' && (
            <div className="flex flex-wrap gap-1">
              {data.agents.map(a => (
                <span key={a.id} className={`rounded px-1.5 py-0.5 text-[10px] ${
                  a.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-600'
                }`}>
                  {a.name}
                </span>
              ))}
            </div>
          )}
          <span className="inline-block rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-400">
            dry-run
          </span>
        </div>
      )}
    </div>
  );
}
