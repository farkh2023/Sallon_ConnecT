'use client';

import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps } from '../core/widgetTypes';
import type { DiagnosticsApiResponse } from '@/lib/types';

function formatUptime(s: number): string {
  if (s < 60)   return `${Math.floor(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  return `${Math.floor(s / 3600)}h`;
}

export function ServiceStatusWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<DiagnosticsApiResponse>('/api/diagnostics/overview');

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Service</span>
        <button type="button" onClick={() => void refresh()} aria-label="Actualiser service" className="text-[10px] text-slate-600 hover:text-slate-400">↻</button>
      </div>
      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate">{error}</p>}
      {data && (
        <div className="space-y-1">
          <p className="text-xs text-slate-400">
            Uptime : <span className="font-semibold text-slate-200">{formatUptime(data.uptime)}</span>
          </p>
          {size !== 'small' && (
            <>
              <p className="text-xs text-slate-500">
                RAM : {Math.round(data.memory.rss / 1024 / 1024)} Mo RSS
              </p>
              <p className="text-xs text-slate-600">
                Scheduler : {data.scheduler.running ? 'actif' : 'inactif'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
