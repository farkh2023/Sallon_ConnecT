'use client';

import type { RestoreAssistantResponse } from '@/lib/types';

interface Props {
  assistant: RestoreAssistantResponse;
  onNext:    () => void;
  onBack:    () => void;
}

export function RestoreStepIntegrity({ assistant, onNext, onBack }: Props) {
  const integrity = assistant.integrity;

  if (!integrity) {
    return (
      <div className="space-y-3">
        <div className="text-xs text-slate-500">Verification d&apos;integrite non disponible.</div>
        <div className="flex gap-2">
          <button onClick={onBack} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:bg-white/5">Retour</button>
        </div>
      </div>
    );
  }

  const ok      = integrity.ok;
  const results = integrity.results ?? [];

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border p-4 ${ok ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-red-400/20 bg-red-400/5'}`}>
        <p className={`mb-2 text-sm font-semibold ${ok ? 'text-emerald-300' : 'text-red-300'}`}>
          {ok ? 'Integrite SHA256 confirmee' : 'Problemes d\'integrite detectes'}
        </p>
        {results.length > 0 && (
          <div className="max-h-40 overflow-y-auto space-y-2">
            {results.map((r, i) => (
              <div key={i} className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className={r.status === 'valid' ? 'text-emerald-400' : 'text-red-400'}>
                    {r.status === 'valid' ? '✓' : '✗'}
                  </span>
                  <code className="text-slate-300">{r.snapshotId}</code>
                  <span className="ml-auto text-slate-400">{r.verified?.length ?? 0} fichiers verifie(s)</span>
                </div>
                {r.missing?.length > 0 && (
                  <p className="pl-5 text-amber-300">Manquants : {r.missing.join(', ')}</p>
                )}
                {r.corrupted?.length > 0 && (
                  <p className="pl-5 text-red-300">Corrompus : {r.corrupted.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        )}
        {results.length === 0 && (
          <p className="text-xs text-slate-500">Aucun resultat de verification disponible.</p>
        )}
      </div>

      {!ok && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-300">
          La restauration est bloquee car l&apos;integrite n&apos;est pas confirmee.
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onBack} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:bg-white/5">Retour</button>
        <button
          onClick={onNext}
          disabled={!ok}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-40"
        >
          Continuer vers le dry-run
        </button>
      </div>
    </div>
  );
}
