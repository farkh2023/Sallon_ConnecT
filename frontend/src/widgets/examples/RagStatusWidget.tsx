'use client';

import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps } from '../core/widgetTypes';
import type { RagStatusResponse } from '@/lib/types';

export function RagStatusWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<RagStatusResponse>('/api/ai/rag/status');

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">RAG local</span>
        <button
          type="button"
          onClick={() => void refresh()}
          aria-label="Actualiser statut RAG"
          className="text-[10px] text-slate-600 hover:text-slate-400"
        >
          ↻
        </button>
      </div>

      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate" role="alert">{error}</p>}

      {!loading && !error && !data && (
        <p className="text-xs text-slate-600">Aucun statut RAG.</p>
      )}

      {data && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${data.indexed ? 'bg-emerald-400' : 'bg-slate-600'}`}
              aria-hidden
            />
            <span className="text-sm font-semibold text-slate-200">
              {data.indexed ? `${data.chunkCount} chunks` : 'Non indexe'}
            </span>
          </div>
          {size !== 'small' && data.indexed && (
            <>
              <p className="text-[10px] text-slate-500">
                Mode : {data.mode === 'embedding' ? 'Vectoriel' : 'Lexical'}
              </p>
              <p className="text-[10px] text-slate-500">
                Sources : {data.sources?.length ?? 0}
              </p>
              {data.mode === 'lexical' && (
                <p className="text-[10px] text-amber-400">Fallback lexical</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
