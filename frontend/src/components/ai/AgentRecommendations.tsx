'use client';

import type { AgentRecommendation, RagCitation } from '@/lib/types';

interface AgentRecommendationsProps {
  recommendations: AgentRecommendation[];
  citations:       RagCitation[];
  rejectedActions: { tool: string; reason: string }[];
}

export function AgentRecommendations({
  recommendations,
  citations,
  rejectedActions,
}: AgentRecommendationsProps) {
  if (recommendations.length === 0 && citations.length === 0 && rejectedActions.length === 0) {
    return <p className="text-xs text-slate-600">Aucune recommandation disponible.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Recommandations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400">Recommandations</p>
          {recommendations.map((rec, i) => (
            <div key={i} className="rounded-xl border border-white/8 bg-white/3 px-3 py-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-sky-400">{rec.agentName}</span>
                <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                  dry-run
                </span>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap">{rec.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Citations */}
      {citations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400">Sources documentaires (RAG)</p>
          {citations.map((c, i) => (
            <div key={i} className="rounded border border-white/8 bg-white/3 px-3 py-1.5">
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] font-semibold text-slate-500">[{c.index}]</span>
                <span className="text-[10px] text-sky-400/80">{c.source}</span>
                {c.heading && (
                  <span className="text-[10px] text-slate-600">&gt; {c.heading}</span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">{c.excerpt}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions rejetees */}
      {rejectedActions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-red-400">Actions rejetees</p>
          {rejectedActions.map((a, i) => (
            <div key={i} className="rounded border border-red-500/20 bg-red-500/5 px-3 py-1.5">
              <span className="text-[11px] font-semibold text-red-300">{a.tool}</span>
              <span className="ml-2 text-[11px] text-red-400/80">{a.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
