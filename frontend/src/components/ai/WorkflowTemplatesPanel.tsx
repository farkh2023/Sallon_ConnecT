'use client';

import type { WorkflowTemplateSummary } from '@/lib/types';

interface WorkflowTemplatesPanelProps {
  templates:       WorkflowTemplateSummary[];
  loading:         boolean;
  onUseTemplate:   (id: string) => void;
}

export function WorkflowTemplatesPanel({ templates, loading, onUseTemplate }: WorkflowTemplatesPanelProps) {
  if (templates.length === 0) {
    return <p className="text-xs text-slate-600">Aucun template disponible.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {templates.map(t => (
        <div key={t.id} className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-200">{t.name}</span>
            <span className="text-[10px] text-slate-600">{t.nodeCount} noeuds</span>
          </div>
          <p className="text-xs text-slate-500">{t.description}</p>
          <div className="flex items-center gap-2 pt-1">
            <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-400">dry-run</span>
            <button
              type="button"
              onClick={() => onUseTemplate(t.id)}
              disabled={loading}
              aria-label={`Utiliser le template ${t.name}`}
              className="rounded border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] text-violet-300 hover:bg-violet-500/20 disabled:opacity-40"
            >
              Utiliser ce template
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
