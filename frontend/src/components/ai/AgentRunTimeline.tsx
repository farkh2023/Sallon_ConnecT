'use client';

import type { AgentRunStep } from '@/lib/types';

interface AgentRunTimelineProps {
  steps: AgentRunStep[];
}

export function AgentRunTimeline({ steps }: AgentRunTimelineProps) {
  if (steps.length === 0) {
    return (
      <p className="text-xs text-slate-600">Aucune etape enregistree.</p>
    );
  }

  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={step.agentId + i} className="relative pl-6">
          {/* Indicateur */}
          <span className={`absolute left-0 top-1 h-3 w-3 rounded-full border-2 ${
            step.ok
              ? 'border-emerald-500 bg-emerald-500/20'
              : 'border-red-500 bg-red-500/20'
          }`} />

          <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-300">{step.agentName}</span>
              <span className={`text-[10px] ${step.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {step.ok ? 'OK' : 'Echec'}
              </span>
            </div>

            {/* Outils utilises */}
            {step.steps.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {step.steps.map((s, j) => (
                  <span key={j} className={`rounded px-1.5 py-0.5 text-[10px] ${
                    s.ok ? 'bg-white/8 text-slate-500' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {s.tool}
                  </span>
                ))}
              </div>
            )}

            {/* Sortie de l'agent */}
            {step.output && (
              <p className="text-[11px] text-slate-400 line-clamp-3">{step.output}</p>
            )}

            {/* Erreur */}
            {step.error && (
              <p className="text-[11px] text-red-400" role="alert">{step.error}</p>
            )}

            {/* Actions rejetees */}
            {step.rejectedActions.length > 0 && (
              <div className="rounded bg-red-500/5 px-2 py-1">
                <p className="text-[10px] font-semibold text-red-400">Actions rejetees :</p>
                {step.rejectedActions.map((a, j) => (
                  <p key={j} className="text-[10px] text-red-300">{a.tool} — {a.reason}</p>
                ))}
              </div>
            )}

            {/* Badge dry-run */}
            <span className="inline-block rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-400">
              dry-run
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
