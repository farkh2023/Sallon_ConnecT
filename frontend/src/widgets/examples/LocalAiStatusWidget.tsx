'use client';

import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps, WidgetSize } from '../core/widgetTypes';
import type { AiStatusResponse } from '@/lib/types';

function dot(available: boolean) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${available ? 'bg-emerald-400' : 'bg-slate-600'}`}
      aria-hidden
    />
  );
}

function statusLabel(status: AiStatusResponse, size: WidgetSize): string {
  if (!status.enabled)   return 'IA desactivee';
  if (!status.available) return 'Ollama indisponible';
  return size === 'small' ? status.model : `${status.provider} — ${status.model}`;
}

export function LocalAiStatusWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<AiStatusResponse>('/api/ai/status');

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">IA locale</span>
        <button
          type="button"
          onClick={() => void refresh()}
          aria-label="Actualiser statut IA"
          className="text-[10px] text-slate-600 hover:text-slate-400"
        >
          ↻
        </button>
      </div>
      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate" role="alert">{error}</p>}
      {!loading && !error && !data && <p className="text-xs text-slate-600">Aucun statut.</p>}
      {data && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {dot(data.available)}
            <span className="text-sm font-semibold text-slate-200">{statusLabel(data, size)}</span>
          </div>
          {size !== 'small' && (
            <>
              <p className="text-[10px] text-slate-500">Provider : {data.provider}</p>
              {data.safety && (
                <p className="text-[10px] text-emerald-500">Local IA uniquement</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
