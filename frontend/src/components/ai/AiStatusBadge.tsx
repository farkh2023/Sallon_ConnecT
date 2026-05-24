'use client';

import type { AiStatusResponse } from '@/lib/types';

interface Props {
  status: AiStatusResponse | null;
  loading?: boolean;
}

export function AiStatusBadge({ status, loading }: Props) {
  if (loading || !status) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
        IA locale...
      </span>
    );
  }

  if (!status.enabled) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
        IA desactivee
      </span>
    );
  }

  if (!status.available) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Ollama indisponible
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      IA locale — {status.model}
    </span>
  );
}
