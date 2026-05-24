'use client';

import type { AgentSafetySummary as SummaryType } from '@/lib/types';

interface AgentSafetySummaryProps {
  summary: SummaryType | null;
}

export function AgentSafetySummary({ summary }: AgentSafetySummaryProps) {
  if (!summary) return null;

  const flags = [
    { key: 'localOnly',       label: 'Local uniquement',       value: summary.localOnly },
    { key: 'dryRun',          label: 'Dry-run actif',          value: summary.dryRun },
    { key: 'noAutoExecution', label: 'Aucune execution auto',  value: summary.noAutoExecution },
  ];

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 space-y-2">
      <p className="text-xs font-semibold text-slate-400">Synthese de securite</p>
      <div className="flex flex-wrap gap-2">
        {flags.map(f => (
          <span key={f.key} className={`rounded px-2 py-0.5 text-[10px] font-medium ${
            f.value ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {f.label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
        <div>
          <div className="text-base font-bold text-slate-200">{summary.agentsRun}</div>
          <div className="text-slate-600">agents</div>
        </div>
        <div>
          <div className={`text-base font-bold ${summary.agentsFailed > 0 ? 'text-red-400' : 'text-slate-200'}`}>
            {summary.agentsFailed}
          </div>
          <div className="text-slate-600">echoues</div>
        </div>
        <div>
          <div className={`text-base font-bold ${summary.rejectedTotal > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
            {summary.rejectedTotal}
          </div>
          <div className="text-slate-600">rejets</div>
        </div>
      </div>
    </div>
  );
}
