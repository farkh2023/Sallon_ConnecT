'use client';

import type { MemorySafetyFlags } from '@/lib/types';

interface MemoryStatusBadgeProps {
  enabled: boolean;
  safety:  MemorySafetyFlags | null;
  total?:  number;
}

export function MemoryStatusBadge({ enabled, safety, total }: MemoryStatusBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px]">
      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Local uniquement</span>
      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Aucun cloud</span>
      <span className={`rounded px-2 py-0.5 ${enabled ? 'bg-sky-500/10 text-sky-400' : 'bg-slate-500/10 text-slate-500'}`}>
        {enabled ? 'Memoire active' : 'Memoire desactivee'}
      </span>
      {safety?.secretMaskingEnabled && (
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Secrets masques</span>
      )}
      {total !== undefined && (
        <span className="rounded bg-white/5 px-2 py-0.5 text-slate-400">
          {total} item{total !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
