'use client';

import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps } from '../core/widgetTypes';

interface HealthResponse {
  status: string;
  phase:  number;
  server: string;
  timestamp: string;
}

export function SystemHealthWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<HealthResponse>('/api/health');

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Sante systeme</span>
        <button type="button" onClick={() => void refresh()} aria-label="Actualiser sante systeme" className="text-[10px] text-slate-600 hover:text-slate-400">↻</button>
      </div>
      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate">{error}</p>}
      {data && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${data.status === 'ok' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-sm font-semibold text-slate-200 capitalize">{data.status}</span>
          </div>
          {size !== 'small' && (
            <>
              <p className="text-xs text-slate-500">Phase {data.phase}</p>
              <p className="text-xs text-slate-600">{data.server}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
