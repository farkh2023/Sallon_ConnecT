'use client';

import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps } from '../core/widgetTypes';
import type { MemoryStatusResponse } from '@/lib/types';

export function MemoryStatusWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<MemoryStatusResponse>('/api/ai/memory/status');

  const total = data?.retention?.totalItems ?? 0;
  const max   = data?.retention?.maxItems   ?? 1000;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Memoire IA locale</span>
        <button
          type="button"
          onClick={() => void refresh()}
          aria-label="Actualiser statut memoire"
          className="text-[10px] text-slate-600 hover:text-slate-400"
        >
          ↻
        </button>
      </div>

      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate" role="alert">{error}</p>}

      {data && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${data.enabled ? 'bg-sky-400' : 'bg-slate-600'}`} aria-hidden />
            <span className="text-sm font-semibold text-slate-200">
              {data.enabled ? 'Active' : 'Desactivee'}
            </span>
          </div>
          <p className="text-xs text-slate-400">{total} / {max} items</p>

          {size !== 'small' && data.retention && Object.keys(data.retention.byType || {}).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(data.retention.byType).slice(0, 4).map(([type, count]) => (
                <span key={type} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {type}: {count}
                </span>
              ))}
            </div>
          )}

          <span className="inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">
            local-only
          </span>
        </div>
      )}
    </div>
  );
}
