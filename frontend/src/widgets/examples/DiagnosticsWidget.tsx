'use client';

import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps } from '../core/widgetTypes';
import type { DiagnosticsApiResponse } from '@/lib/types';

export function DiagnosticsWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<DiagnosticsApiResponse>('/api/diagnostics/overview');

  const statusColor = data?.status === 'ok' ? 'text-emerald-400' : 'text-amber-400';

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Diagnostics</span>
        <button type="button" onClick={() => void refresh()} aria-label="Actualiser diagnostics" className="text-[10px] text-slate-600 hover:text-slate-400">↻</button>
      </div>
      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate">{error}</p>}
      {data && (
        <div className="space-y-1">
          <p className={`text-sm font-bold capitalize ${statusColor}`}>{data.status}</p>
          {size !== 'small' && (
            <>
              <p className="text-xs text-slate-500">
                Memoire : {Math.round(data.memory.heapUsed / 1024 / 1024)} Mo
              </p>
              <p className="text-xs text-slate-500">Node {data.nodeVersion}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
