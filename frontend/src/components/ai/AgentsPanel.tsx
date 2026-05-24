'use client';

import { useAgents }              from '@/hooks/useAgents';
import { AgentRunForm }           from './AgentRunForm';
import { AgentRunTimeline }       from './AgentRunTimeline';
import { AgentRecommendations }   from './AgentRecommendations';
import { AgentSafetySummary }     from './AgentSafetySummary';

export function AgentsPanel() {
  const {
    agents, runResult, loading, error,
    runAgents, clearResult,
  } = useAgents();

  async function handleRun(task: string, selectedAgents: string[], useRag: boolean) {
    await runAgents({ task, selectedAgents: selectedAgents.length ? selectedAgents : undefined, useRag });
  }

  return (
    <section aria-label="Agents IA locaux orchestres" className="space-y-6">
      {/* En-tete */}
      <div>
        <h2 className="text-base font-semibold text-slate-100">Agents IA locaux</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Orchestration sequentielle locale — dry-run par defaut, validation humaine requise.
        </p>
      </div>

      {/* Badges securite */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Agents locaux uniquement</span>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Aucun cloud</span>
        <span className="rounded bg-amber-400/10 px-2 py-0.5 text-amber-400">Dry-run actif</span>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Secrets masques</span>
      </div>

      {/* Erreur */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300" role="alert">
          {error}
        </div>
      )}

      {/* Etat vide */}
      {agents.length === 0 && !loading && !error && (
        <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-6 text-center text-sm text-slate-500">
          Aucun agent disponible. Verifiez que le backend est demarre et que SALLON_AGENTS_ENABLED=true.
        </div>
      )}

      {/* Formulaire */}
      {agents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400">Nouvelle tache</p>
          <AgentRunForm agents={agents} loading={loading} onSubmit={handleRun} />
        </div>
      )}

      {/* Resultats */}
      {runResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400">
              Resultat — run <code className="text-slate-500">{runResult.runId}</code>
            </p>
            <button
              type="button"
              onClick={clearResult}
              aria-label="Effacer les resultats"
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-400 hover:text-slate-200"
            >
              Effacer
            </button>
          </div>

          {/* Synthese */}
          {runResult.summary && (
            <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
              <p className="text-xs font-semibold text-slate-400 mb-1">Synthese</p>
              <p className="text-xs text-slate-300 whitespace-pre-wrap">{runResult.summary}</p>
            </div>
          )}

          {/* Safety summary */}
          <AgentSafetySummary summary={runResult.safetySummary ?? null} />

          {/* Timeline */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400">Timeline d&apos;execution</p>
            <AgentRunTimeline steps={runResult.steps} />
          </div>

          {/* Recommandations, citations, rejets */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400">Recommandations et sources</p>
            <AgentRecommendations
              recommendations={runResult.recommendations}
              citations={runResult.citations}
              rejectedActions={runResult.rejectedActions}
            />
          </div>
        </div>
      )}
    </section>
  );
}
