'use client';

import type { RagCitation } from '@/lib/types';

interface Props {
  citations: RagCitation[];
  mode?:     string;
}

export function RagCitationsList({ citations, mode }: Props) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase text-slate-600">
        Sources ({citations.length}){mode ? ` — mode ${mode}` : ''}
      </p>
      <ul className="space-y-1" aria-label="Citations documentaires">
        {citations.map(c => (
          <li key={c.index} className="rounded border border-white/5 bg-white/[0.03] px-2 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-sky-500/80">
                [{c.index}] {c.source}
              </span>
              {c.score !== null && (
                <span className="text-[9px] text-slate-600">
                  {(c.score * 100).toFixed(0)}%
                </span>
              )}
            </div>
            {c.heading && (
              <p className="mt-0.5 text-[10px] font-medium text-slate-400">{c.heading}</p>
            )}
            {c.excerpt && (
              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-600 line-clamp-2">
                {c.excerpt}
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="text-[9px] text-slate-700">
        RAG local uniquement — aucune donnee transmise en dehors de votre machine.
      </p>
    </div>
  );
}
