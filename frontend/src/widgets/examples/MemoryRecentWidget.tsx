'use client';

import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps } from '../core/widgetTypes';
import type { MemoryListResponse } from '@/lib/types';

export function MemoryRecentWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<MemoryListResponse>('/api/ai/memory');

  const displayed = size === 'small'
    ? data?.items.slice(0, 2)
    : data?.items.slice(0, 5);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Memoire recente</span>
        <button
          type="button"
          onClick={() => void refresh()}
          aria-label="Actualiser la memoire recente"
          className="text-[10px] text-slate-600 hover:text-slate-400"
        >
          ↻
        </button>
      </div>

      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate" role="alert">{error}</p>}

      {!loading && !error && !data && (
        <p className="text-xs text-slate-600">Aucun item en memoire.</p>
      )}

      {data && (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-200">
            {data.total} item{data.total !== 1 ? 's' : ''}
          </p>
          {(displayed ?? []).length === 0 ? (
            <p className="text-xs text-slate-600">Memoire vide.</p>
          ) : (
            <ul className="space-y-1">
              {displayed?.map(item => (
                <li key={item.id} className="rounded border border-white/8 bg-white/3 px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-white/5 px-1 py-0.5 text-[10px] text-slate-500">{item.type}</span>
                    <span className="text-[10px] text-slate-600">{item.scope}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-400 line-clamp-1">{item.content}</p>
                </li>
              ))}
            </ul>
          )}
          <span className="inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">local-only</span>
        </div>
      )}
    </div>
  );
}
