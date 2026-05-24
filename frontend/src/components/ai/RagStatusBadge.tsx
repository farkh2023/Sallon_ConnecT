'use client';

import type { RagStatusResponse } from '@/lib/types';

interface Props {
  status:  RagStatusResponse | null;
  loading: boolean;
}

export function RagStatusBadge({ status, loading }: Props) {
  if (loading && !status) {
    return <span className="rounded bg-slate-500/10 px-2 py-0.5 text-[10px] text-slate-500">Chargement...</span>;
  }
  if (!status || !status.indexed) {
    return <span className="rounded bg-slate-600/20 px-2 py-0.5 text-[10px] text-slate-500">Non indexe</span>;
  }

  const modeLabel = status.mode === 'embedding' ? 'Vectoriel' : 'Lexical';
  const modeColor = status.mode === 'embedding'
    ? 'bg-sky-500/10 text-sky-400'
    : 'bg-amber-500/10 text-amber-400';

  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
      <span className="text-[10px] text-slate-400">
        {status.chunkCount} chunks
      </span>
      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${modeColor}`}>
        {modeLabel}
      </span>
    </div>
  );
}
