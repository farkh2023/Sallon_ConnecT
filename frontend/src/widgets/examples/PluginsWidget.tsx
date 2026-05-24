'use client';

import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps } from '../core/widgetTypes';
import type { PluginsListResponse } from '@/lib/types';

export function PluginsWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<PluginsListResponse>('/api/plugins/list');
  const active = data?.plugins.filter(p => p.enabled).length ?? 0;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Plugins</span>
        <button type="button" onClick={() => void refresh()} aria-label="Actualiser plugins" className="text-[10px] text-slate-600 hover:text-slate-400">↻</button>
      </div>
      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate">{error}</p>}
      {data && (
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-100">{data.total}</p>
            <p className="text-[10px] text-slate-500">Detectes</p>
          </div>
          {size !== 'small' && (
            <div className="text-center">
              <p className="text-lg font-semibold text-emerald-400">{active}</p>
              <p className="text-[10px] text-slate-600">Actifs</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
