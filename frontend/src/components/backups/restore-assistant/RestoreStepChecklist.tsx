'use client';

import type { RestoreChecklistItem } from '@/lib/types';
import { RestoreChecklist } from './RestoreChecklist';

interface Props {
  checklist: RestoreChecklistItem[];
  onToggle:  (id: string) => void;
  onNext:    () => void;
  onBack:    () => void;
}

export function RestoreStepChecklist({ checklist, onToggle, onNext, onBack }: Props) {
  const allChecked = checklist.every(i => i.checked);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        Cochez chaque point pour confirmer votre comprehension avant d&apos;afficher la commande.
      </p>
      <RestoreChecklist items={checklist} onToggle={onToggle} />
      <div className="flex gap-2">
        <button onClick={onBack} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:bg-white/5">Retour</button>
        <button
          onClick={onNext} disabled={!allChecked}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-40"
        >
          Afficher la commande
        </button>
      </div>
    </div>
  );
}
