'use client';

import type { WorkflowNodeResult, RagCitation } from '@/lib/types';

interface WorkflowRunTimelineProps {
  nodeResults:     WorkflowNodeResult[];
  citations:       RagCitation[];
  rejectedActions: { nodeId?: string; type?: string; reason: string }[];
}

export function WorkflowRunTimeline({ nodeResults, citations, rejectedActions }: WorkflowRunTimelineProps) {
  if (nodeResults.length === 0) {
    return <p className="text-xs text-slate-600">Aucune etape enregistree.</p>;
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {nodeResults.map((r, i) => (
          <li key={r.nodeId + i} className="relative pl-5">
            <span className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${r.ok ? 'bg-emerald-400' : 'bg-red-400'}`} aria-hidden />
            <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-300">{r.label}</span>
                <div className="flex items-center gap-1">
                  <span className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] text-slate-600">{r.type}</span>
                  <span className={`text-[10px] ${r.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.ok ? 'OK' : 'Echec'}
                  </span>
                </div>
              </div>
              {r.output && <p className="text-[11px] text-slate-400 line-clamp-3">{r.output}</p>}
              {r.error  && <p className="text-[11px] text-red-400" role="alert">{r.error}</p>}
              <span className="inline-block rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-400">dry-run</span>
            </div>
          </li>
        ))}
      </ol>

      {citations.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400">Citations RAG</p>
          {citations.map((c, i) => (
            <div key={i} className="rounded border border-white/8 bg-white/3 px-3 py-1.5">
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] font-semibold text-slate-500">[{c.index}]</span>
                <span className="text-[10px] text-sky-400/80">{c.source}</span>
                {c.heading && <span className="text-[10px] text-slate-600">&gt; {c.heading}</span>}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">{c.excerpt}</p>
            </div>
          ))}
        </div>
      )}

      {rejectedActions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-red-400">Actions rejetees</p>
          {rejectedActions.map((a, i) => (
            <div key={i} className="rounded border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-[11px]">
              <span className="font-semibold text-red-300">{a.nodeId || a.type}</span>
              <span className="ml-2 text-red-400/80">{a.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
