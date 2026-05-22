'use client';

import type { RestoreRiskResult } from '@/lib/types';
import { RestoreRiskBadge } from './RestoreRiskBadge';

interface Props {
  risk:    RestoreRiskResult | null;
  loading: boolean;
  onLoad:  () => void;
  onNext:  () => void;
  onBack:  () => void;
}

export function RestoreStepRisk({ risk, loading, onLoad, onNext, onBack }: Props) {
  if (!risk) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Le score de risque evalue la securite de la restauration.</p>
        <button
          onClick={onLoad} disabled={loading}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-40"
        >
          {loading ? 'Calcul...' : 'Calculer le score'}
        </button>
        <button onClick={onBack} className="ml-2 rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:bg-white/5">Retour</button>
      </div>
    );
  }

  const blocked = risk.level === 'blocked';

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.08] bg-[#0A2540] p-4 space-y-3">
        <div className="flex items-center gap-3">
          <RestoreRiskBadge level={risk.level} score={risk.score} />
        </div>

        {risk.blockingReasons.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-red-300">Raisons du blocage :</p>
            {risk.blockingReasons.map((r, i) => <p key={i} className="text-xs text-red-400">! {r}</p>)}
          </div>
        )}

        {risk.reasons.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">Facteurs de risque :</p>
            {risk.reasons.map((r, i) => <p key={i} className="text-xs text-slate-400">- {r}</p>)}
          </div>
        )}
      </div>

      {blocked && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-300">
          La restauration est bloquee en raison du score de risque.
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onBack} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:bg-white/5">Retour</button>
        <button
          onClick={onNext} disabled={blocked}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-40"
        >
          Continuer vers la checklist
        </button>
      </div>
    </div>
  );
}
