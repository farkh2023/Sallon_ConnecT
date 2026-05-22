'use client';

import type { RestoreChecklistItem } from '@/lib/types';

interface Props {
  items:    RestoreChecklistItem[];
  onToggle: (id: string) => void;
}

export function RestoreChecklist({ items, onToggle }: Props) {
  const allChecked = items.every(i => i.checked);

  return (
    <div className="space-y-2">
      {items.map(item => (
        <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.08] p-3 hover:bg-white/5">
          <input
            type="checkbox"
            checked={!!item.checked}
            onChange={() => onToggle(item.id)}
            className="mt-0.5 shrink-0 accent-amber-400"
          />
          <span className="text-xs text-slate-300">{item.label}</span>
        </label>
      ))}
      <p className={`mt-2 text-xs font-medium ${allChecked ? 'text-emerald-300' : 'text-slate-500'}`}>
        {allChecked
          ? 'Checklist complete — vous pouvez afficher la commande.'
          : `${items.filter(i => !i.checked).length} element(s) restant(s).`}
      </p>
    </div>
  );
}
