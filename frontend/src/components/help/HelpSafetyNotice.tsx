'use client';

import { getBlockedHelpActions } from '@/lib/helpSafety';

export function HelpSafetyNotice() {
  const blocked = getBlockedHelpActions();
  return (
    <div className="rounded-xl border border-danger/25 bg-danger/5 p-4">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-danger">
        <span>🔒</span> Actions bloquées dans le Centre d&apos;aide
      </p>
      <ul className="space-y-0.5 text-xs text-slate-400">
        {blocked.map((action) => (
          <li key={action} className="flex items-center gap-1.5">
            <span className="text-danger/60">✕</span>
            {action}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-slate-500">
        Le Centre d&apos;aide affiche des explications — il n&apos;exécute aucune action sensible.
      </p>
    </div>
  );
}
