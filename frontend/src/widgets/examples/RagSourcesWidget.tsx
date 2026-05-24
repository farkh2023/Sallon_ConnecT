'use client';

import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps } from '../core/widgetTypes';
import type { RagStatusResponse } from '@/lib/types';

export function RagSourcesWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<RagStatusResponse>('/api/ai/rag/status');

  const sources = data?.sources ?? [];

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Sources indexees</span>
        <button
          type="button"
          onClick={() => void refresh()}
          aria-label="Actualiser sources RAG"
          className="text-[10px] text-slate-600 hover:text-slate-400"
        >
          ↻
        </button>
      </div>

      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate" role="alert">{error}</p>}

      {!loading && !error && !data?.indexed && (
        <p className="text-xs text-slate-600">Aucun index RAG.</p>
      )}

      {data?.indexed && (
        <>
          <p className="text-[10px] text-slate-500">
            {sources.length} source{sources.length !== 1 ? 's' : ''} / {data.chunkCount} chunks
          </p>
          {size !== 'small' && (
            <ul className="space-y-0.5 overflow-y-auto">
              {sources.slice(0, 8).map(s => (
                <li key={s.path} className="flex items-center justify-between text-[10px] text-slate-600">
                  <span className="font-mono truncate max-w-[75%]">{s.path}</span>
                  <span className="shrink-0 text-slate-700">{s.chunks}</span>
                </li>
              ))}
              {sources.length > 8 && (
                <li className="text-[10px] text-slate-700">+ {sources.length - 8} autres</li>
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
