'use client';

import { useState } from 'react';
import type { WorkflowSummary } from '@/lib/types';

interface WorkflowListProps {
  workflows:  WorkflowSummary[];
  loading:    boolean;
  onRun:      (id: string) => void;
  onDelete:   (id: string) => void;
  onExport:   (id: string) => void;
}

export function WorkflowList({ workflows, loading, onRun, onDelete, onExport }: WorkflowListProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (workflows.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-6 text-center text-sm text-slate-500">
        Aucun workflow. Cliquez sur un template pour en creer un.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {workflows.map(wf => (
        <li key={wf.id} className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200 truncate">{wf.name}</span>
                {wf._isTemplate && (
                  <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] text-violet-400">template</span>
                )}
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                  wf.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-500'
                }`}>
                  {wf.enabled ? 'actif' : 'inactif'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 truncate">{wf.description}</p>
              <p className="mt-0.5 text-[10px] text-slate-600">{wf.nodeCount} noeuds · dry-run · local</p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => onRun(wf.id)}
                disabled={loading || !wf.enabled}
                aria-label={`Executer le workflow ${wf.name}`}
                className="rounded border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-400 hover:bg-sky-500/20 disabled:opacity-40"
              >
                ▶ Run
              </button>
              <button
                type="button"
                onClick={() => onExport(wf.id)}
                aria-label={`Exporter le workflow ${wf.name}`}
                className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
              >
                Export
              </button>

              {confirmDelete === wf.id ? (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-red-400">Confirmer ?</span>
                  <button
                    type="button"
                    onClick={() => { onDelete(wf.id); setConfirmDelete(null); }}
                    aria-label={`Confirmer la suppression de ${wf.name}`}
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
                  onClick={() => setConfirmDelete(wf.id)}
                  aria-label={`Supprimer le workflow ${wf.name}`}
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
