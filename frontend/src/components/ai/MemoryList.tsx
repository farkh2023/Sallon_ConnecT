'use client';

import { useState } from 'react';
import type { MemoryItem, MemoryItemType } from '@/lib/types';

const TYPE_COLORS: Record<MemoryItemType, string> = {
  preference:           'bg-violet-500/10 text-violet-400',
  fact:                 'bg-sky-500/10 text-sky-400',
  summary:              'bg-amber-500/10 text-amber-400',
  'workflow-result':    'bg-emerald-500/10 text-emerald-400',
  'agent-result':       'bg-teal-500/10 text-teal-400',
  'diagnostic-insight': 'bg-orange-500/10 text-orange-400',
  note:                 'bg-slate-500/10 text-slate-400',
};

interface MemoryListProps {
  items:     MemoryItem[];
  loading:   boolean;
  onEdit:    (item: MemoryItem) => void;
  onDelete:  (id: string) => void;
}

export function MemoryList({ items, loading, onEdit, onDelete }: MemoryListProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expanded,      setExpanded]      = useState<string | null>(null);

  if (items.length === 0 && !loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-6 text-center text-sm text-slate-500">
        Aucun item en memoire. Ajoutez votre premiere entree.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map(item => (
        <li key={item.id} className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[item.type] || 'bg-white/5 text-slate-400'}`}>
                  {item.type}
                </span>
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">{item.scope}</span>
                {item.source && (
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-600">{item.source}</span>
                )}
                <span className="text-[10px] text-slate-600">imp. {item.importance}/10</span>
              </div>

              <p
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                className={`mt-1.5 text-xs text-slate-300 cursor-pointer ${expanded === item.id ? '' : 'line-clamp-2'}`}
              >
                {item.content}
              </p>

              {item.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {item.tags.map(tag => (
                    <span key={tag} className="rounded bg-sky-500/10 px-1 py-0.5 text-[10px] text-sky-500">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-1 text-[10px] text-slate-600">
                {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => onEdit(item)}
                aria-label={`Modifier l'item ${item.id}`}
                className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
              >
                Editer
              </button>

              {confirmDelete === item.id ? (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-red-400">Confirmer ?</span>
                  <button
                    type="button"
                    onClick={() => { onDelete(item.id); setConfirmDelete(null); }}
                    aria-label={`Confirmer la suppression de ${item.id}`}
                    className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] text-red-400 hover:bg-red-500/30"
                  >
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                    aria-label="Annuler la suppression"
                    className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    Non
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(item.id)}
                  aria-label={`Supprimer l'item ${item.id}`}
                  className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-500 hover:text-red-400"
                >
                  Suppr.
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
