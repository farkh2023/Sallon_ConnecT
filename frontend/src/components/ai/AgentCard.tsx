'use client';

import type { AgentManifest } from '@/lib/types';

interface AgentCardProps {
  agent:    AgentManifest;
  selected: boolean;
  onToggle: (id: string) => void;
}

export function AgentCard({ agent, selected, onToggle }: AgentCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(agent.id)}
      aria-pressed={selected}
      aria-label={`${selected ? 'Deselectionner' : 'Selectionner'} ${agent.name}`}
      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
        selected
          ? 'border-sky-400/40 bg-sky-400/10'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      } ${!agent.enabled ? 'opacity-40' : ''}`}
      disabled={!agent.enabled}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-200">{agent.name}</span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
          agent.enabled
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-slate-500/15 text-slate-500'
        }`}>
          {agent.enabled ? 'actif' : 'inactif'}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{agent.description}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {agent.tools.map(t => (
          <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-600">
            {t}
          </span>
        ))}
      </div>
    </button>
  );
}
