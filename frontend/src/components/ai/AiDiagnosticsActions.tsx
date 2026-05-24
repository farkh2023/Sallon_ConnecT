'use client';

import { useState } from 'react';
import type { AiChatResponse, AiCommandResponse } from '@/lib/types';

interface Props {
  disabled:            boolean;
  loading:             boolean;
  onAnalyzeDiagnostics: () => Promise<AiChatResponse | null>;
  onSuggestCommand:    (task: string) => Promise<AiCommandResponse | null>;
}

export function AiDiagnosticsActions({ disabled, loading, onAnalyzeDiagnostics, onSuggestCommand }: Props) {
  const [diagResult,    setDiagResult]    = useState<string | null>(null);
  const [commandResult, setCommandResult] = useState<AiCommandResponse | null>(null);
  const [taskInput,     setTaskInput]     = useState('');
  const [localLoading,  setLocalLoading]  = useState(false);

  async function handleDiagnose() {
    setLocalLoading(true);
    setDiagResult(null);
    const res = await onAnalyzeDiagnostics();
    setDiagResult(res?.response ?? res?.error ?? 'Pas de reponse.');
    setLocalLoading(false);
  }

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault();
    if (!taskInput.trim()) return;
    setLocalLoading(true);
    setCommandResult(null);
    const res = await onSuggestCommand(taskInput.trim());
    setCommandResult(res);
    setLocalLoading(false);
  }

  const busy = disabled || loading || localLoading;

  return (
    <div className="space-y-4">
      {/* Analyse diagnostics */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-300">Analyser les diagnostics</p>
          <button
            type="button"
            onClick={() => void handleDiagnose()}
            disabled={busy}
            aria-label="Lancer l'analyse des diagnostics par l'IA locale"
            className="rounded-lg border border-sky-400/30 bg-sky-400/15 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-400/25 disabled:opacity-40"
          >
            {localLoading ? 'Analyse...' : 'Analyser'}
          </button>
        </div>
        {diagResult && (
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-[11px] text-slate-300">
            {diagResult}
          </pre>
        )}
        {!diagResult && !localLoading && (
          <p className="text-xs text-slate-600">Cliquez sur Analyser pour obtenir une analyse IA du systeme.</p>
        )}
      </div>

      {/* Suggestion de commande */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-3 text-xs font-semibold text-slate-300">Suggerer une commande PowerShell</p>
        <form onSubmit={e => void handleSuggest(e)} className="flex gap-2">
          <input
            type="text"
            value={taskInput}
            onChange={e => setTaskInput(e.target.value)}
            disabled={busy}
            placeholder="Ex : lister les ports ouverts"
            aria-label="Tache pour laquelle suggerer une commande"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-sky-400/40 focus:outline-none disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={busy || !taskInput.trim()}
            aria-label="Obtenir une suggestion de commande"
            className="rounded-lg border border-emerald-400/30 bg-emerald-400/15 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/25 disabled:opacity-40"
          >
            Suggerer
          </button>
        </form>

        {commandResult && (
          <div className="mt-3 space-y-2">
            {commandResult.ok && commandResult.command ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400">[DRY-RUN] Verifier avant execution manuelle</span>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(commandResult.command ?? '')}
                    aria-label="Copier la commande suggeree"
                    className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400 hover:text-slate-200"
                  >
                    Copier
                  </button>
                </div>
                <pre className="overflow-auto rounded-lg bg-black/40 p-3 text-[11px] text-sky-300">
                  {commandResult.command}
                </pre>
                <p className="text-[10px] text-slate-600">
                  Suggestion locale uniquement. Aucune execution automatique.
                </p>
              </>
            ) : (
              <p className="text-xs text-red-400">{commandResult.error ?? 'Commande non disponible.'}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
