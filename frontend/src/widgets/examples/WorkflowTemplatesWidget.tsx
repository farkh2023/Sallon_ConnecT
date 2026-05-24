'use client';

import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps } from '../core/widgetTypes';
import type { WorkflowTemplateSummary } from '@/lib/types';

interface TemplatesResponse {
  templates: WorkflowTemplateSummary[];
  total:     number;
}

export function WorkflowTemplatesWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<TemplatesResponse>('/api/ai/workflows/templates');

  const displayed = size === 'small'
    ? data?.templates.slice(0, 2)
    : data?.templates.slice(0, 4);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Templates workflows</span>
        <button
          type="button"
          onClick={() => void refresh()}
          aria-label="Actualiser les templates"
          className="text-[10px] text-slate-600 hover:text-slate-400"
        >
          ↻
        </button>
      </div>

      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate" role="alert">{error}</p>}

      {!loading && !error && !data && (
        <p className="text-xs text-slate-600">Aucun template disponible.</p>
      )}

      {data && (
        <div className="space-y-1">
          <span className="text-sm font-semibold text-slate-200">
            {data.total} template{data.total !== 1 ? 's' : ''}
          </span>
          <div className="flex flex-wrap gap-1">
            {displayed?.map(t => (
              <span
                key={t.id}
                title={t.description}
                className="rounded border border-violet-500/20 bg-violet-500/5 px-1.5 py-0.5 text-[10px] text-violet-300"
              >
                {t.name}
              </span>
            ))}
          </div>
          <span className="inline-block rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-400">dry-run</span>
        </div>
      )}
    </div>
  );
}
