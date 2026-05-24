'use client';

import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps } from '../core/widgetTypes';
import type { AgentsRunsResponse } from '@/lib/types';

export function AgentRecommendationsWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<AgentsRunsResponse>('/api/ai/agents/runs');

  const lastRun = data?.runs?.[0] ?? null;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Derniere run agents</span>
        <button
          type="button"
          onClick={() => void refresh()}
          aria-label="Actualiser historique agents"
          className="text-[10px] text-slate-600 hover:text-slate-400"
        >
          ↻
        </button>
      </div>

      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate" role="alert">{error}</p>}

      {!loading && !error && !lastRun && (
        <p className="text-xs text-slate-600">Aucune run enregistree.</p>
      )}

      {lastRun && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${lastRun.status === 'completed' ? 'bg-emerald-400' : 'bg-red-400'}`}
              aria-hidden
            />
            <span className="text-xs font-medium text-slate-300 truncate">{lastRun.task}</span>
          </div>
          {size !== 'small' && (
            <>
              <p className="text-[10px] text-slate-500">
                Agents : {lastRun.agentsUsed?.join(', ') || 'aucun'}
              </p>
              <p className="text-[10px] text-slate-600">
                {lastRun.completedAt
                  ? new Date(lastRun.completedAt).toLocaleString('fr-FR')
                  : lastRun.startedAt
                    ? new Date(lastRun.startedAt).toLocaleString('fr-FR')
                    : '—'}
              </p>
            </>
          )}
          <span className="inline-block rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-400">
            dry-run
          </span>
        </div>
      )}
    </div>
  );
}
