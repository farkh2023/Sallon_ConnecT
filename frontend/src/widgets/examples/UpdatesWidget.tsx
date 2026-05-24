'use client';

import type { WidgetProps } from '../core/widgetTypes';

export function UpdatesWidget({ size }: WidgetProps) {
  const compact = size === 'small';
  return (
    <div className="flex h-full flex-col gap-2">
      <span className="text-xs text-slate-500">Mises a jour</span>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
            v0.4.0
          </span>
          <span className="text-xs text-slate-400">
            {compact ? 'Stable' : 'Version actuelle — stable'}
          </span>
        </div>
        {!compact && (
          <>
            <p className="text-[10px] text-slate-600">Verifier les mises a jour via PowerShell :</p>
            <code className="block rounded bg-black/30 px-2 py-1 text-[10px] text-sky-300">
              scripts\windows\update\check-update.ps1
            </code>
          </>
        )}
        <p className="text-[10px] text-slate-600">Local-only — aucune mise a jour automatique.</p>
      </div>
    </div>
  );
}
