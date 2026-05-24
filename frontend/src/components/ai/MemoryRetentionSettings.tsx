'use client';

import type { MemoryRetentionStatus } from '@/lib/types';

interface MemoryRetentionSettingsProps {
  retention: MemoryRetentionStatus | null;
}

export function MemoryRetentionSettings({ retention }: MemoryRetentionSettingsProps) {
  if (!retention) {
    return <p className="text-xs text-slate-600">Statut de retention non disponible.</p>;
  }

  const usagePercent = retention.maxItems > 0
    ? Math.round((retention.totalItems / retention.maxItems) * 100)
    : 0;

  const usageColor = usagePercent >= 90
    ? 'bg-red-500'
    : usagePercent >= 70
      ? 'bg-amber-400'
      : 'bg-emerald-500';

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-slate-400">Parametres de retention</p>

      {/* Usage bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Utilisation memoire</span>
          <span>{retention.totalItems} / {retention.maxItems} items ({usagePercent}%)</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10">
          <div
            className={`h-1.5 rounded-full ${usageColor} transition-all`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
            role="progressbar"
            aria-valuenow={usagePercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Retention info */}
      <div className="grid grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-2">
          <p className="text-slate-500">Retention max</p>
          <p className="font-semibold text-slate-200">{retention.retentionDays} jours</p>
        </div>
        <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-2">
          <p className="text-slate-500">Items importants</p>
          <p className="font-semibold text-slate-200">
            {Object.values(retention.byType).reduce((a, b) => a + b, 0)} total
          </p>
        </div>
      </div>

      {/* By type */}
      {Object.keys(retention.byType).length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 font-medium">Par type</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(retention.byType).map(([type, count]) => (
              <span key={type} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                {type}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* By scope */}
      {Object.keys(retention.byScope).length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 font-medium">Par portee</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(retention.byScope).map(([scope, count]) => (
              <span key={scope} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                {scope}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
