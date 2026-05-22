'use client';

import type { BackupActionResult } from '@/lib/types';

interface Props {
  result:   BackupActionResult | null;
  onClose:  () => void;
}

export function BackupExportPanel({ result, onClose }: Props) {
  if (!result) return null;

  return (
    <div className={`rounded-xl border p-4 ${result.ok ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-red-400/20 bg-red-400/5'}`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold ${result.ok ? 'text-emerald-300' : 'text-red-300'}`}>
          Export ZIP : {result.ok ? 'Termine' : 'Echec'}
        </p>
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300">Fermer</button>
      </div>
      {result.error && (
        <p className="mt-2 text-xs text-red-400">{result.error}</p>
      )}
      {result.ok && (
        <p className="mt-2 text-xs text-slate-400">
          Archive creee dans <code>backups/exports/</code>. Checksum SHA256 genere.
        </p>
      )}
    </div>
  );
}
