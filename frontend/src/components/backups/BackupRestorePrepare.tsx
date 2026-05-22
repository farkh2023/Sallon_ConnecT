'use client';

import type { BackupRestorePrepareResult } from '@/lib/types';

interface Props {
  result:   BackupRestorePrepareResult | null;
  onClose:  () => void;
}

export function BackupRestorePrepare({ result, onClose }: Props) {
  if (!result) return null;

  return (
    <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-amber-300">Preparer la restauration</p>
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300">Fermer</button>
      </div>

      {result.error && (
        <p className="mb-2 text-xs text-red-400">{result.error}</p>
      )}

      {result.ok && (
        <>
          <p className="mb-2 text-xs text-amber-200 font-medium">{result.warning}</p>
          <p className="mb-3 text-xs text-slate-400">{result.instruction}</p>

          <div className="mb-3 rounded-lg bg-black/40 p-3">
            <p className="mb-1 text-xs text-slate-500">Commande PowerShell a executer manuellement :</p>
            <code className="block text-xs text-emerald-300 break-all">{result.command}</code>
          </div>

          {result.risks && result.risks.length > 0 && (
            <ul className="mb-3 space-y-1 text-xs text-slate-400">
              {result.risks.map((r, i) => (
                <li key={i} className="flex gap-2"><span className="text-amber-400 shrink-0">!</span>{r}</li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            {result.localOnly    && <span className="text-emerald-400">100% local</span>}
            {result.noAutoRestore && <span className="text-emerald-400">Aucune restauration automatique</span>}
          </div>
        </>
      )}
    </div>
  );
}
