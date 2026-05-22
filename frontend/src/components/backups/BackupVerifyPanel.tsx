'use client';

import type { BackupVerifyResult } from '@/lib/types';

interface Props {
  result:   BackupVerifyResult | null;
  onClose:  () => void;
}

export function BackupVerifyPanel({ result, onClose }: Props) {
  if (!result) return null;

  const ok = result.ok;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0A2540] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className={`text-sm font-semibold ${ok ? 'text-emerald-300' : 'text-red-300'}`}>
          Verification : {ok ? 'Integrite confirmee' : 'Problemes detectes'}
        </p>
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300">Fermer</button>
      </div>

      {result.error && (
        <p className="mb-2 text-xs text-red-400">{result.error}</p>
      )}

      {result.results.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-3">
          {result.results.map((r, i) => (
            <div key={i} className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className={r.status === 'valid' ? 'text-emerald-400' : 'text-red-400'}>
                  {r.status === 'valid' ? '✓' : '✗'}
                </span>
                <code className="text-slate-300">{r.snapshotId}</code>
                <span className={`ml-auto text-xs font-medium ${r.status === 'valid' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {r.status}
                </span>
              </div>
              {r.missing.length > 0 && (
                <p className="pl-4 text-amber-300">Manquants : {r.missing.join(', ')}</p>
              )}
              {r.corrupted.length > 0 && (
                <p className="pl-4 text-red-300">Corrompus : {r.corrupted.join(', ')}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
