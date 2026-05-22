'use client';

import type { RestoreRiskLevel } from '@/lib/types';

const RISK_STYLES: Record<RestoreRiskLevel, { label: string; className: string }> = {
  low:     { label: 'Risque faible',  className: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
  medium:  { label: 'Risque moyen',   className: 'border-amber-400/40 bg-amber-400/10 text-amber-300' },
  high:    { label: 'Risque eleve',   className: 'border-orange-400/40 bg-orange-400/10 text-orange-300' },
  blocked: { label: 'Bloque',         className: 'border-red-400/40 bg-red-400/10 text-red-300' },
};

interface Props {
  level: RestoreRiskLevel;
  score?: number;
}

export function RestoreRiskBadge({ level, score }: Props) {
  const s = RISK_STYLES[level] ?? RISK_STYLES.blocked;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${s.className}`}>
      {s.label}
      {score !== undefined && <span className="opacity-70">({score})</span>}
    </span>
  );
}
