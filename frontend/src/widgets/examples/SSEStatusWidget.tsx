'use client';

import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps } from '../core/widgetTypes';

interface SSECount {
  count: number;
}

export function SSEStatusWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<SSECount>('/api/events/client-count');
  const compact = size === 'small';

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Flux SSE</span>
        <button
          type="button"
          onClick={() => void refresh()}
          aria-label="Actualiser flux SSE"
          className="text-[10px] text-slate-600 hover:text-slate-400"
        >
          ↻
        </button>
      </div>
      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate" role="alert">{error}</p>}
      {!loading && !error && !data && (
        <p className="text-xs text-slate-600">Aucune donnee SSE.</p>
      )}
      {data && (
        <div className={compact ? 'flex items-center gap-2' : 'text-center'}>
          <p className={`font-bold text-sky-400 ${compact ? 'text-lg' : 'text-2xl'}`}>{data.count}</p>
          {compact
            ? <p className="text-[10px] text-slate-500">client(s)</p>
            : (
              <>
                <p className="text-[10px] text-slate-500">Client(s) connecte(s)</p>
                <p className="mt-1 text-[10px] text-slate-600">Local uniquement</p>
              </>
            )
          }
        </div>
      )}
    </div>
  );
}
