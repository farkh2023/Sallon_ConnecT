'use client';

import { useState } from 'react';
import type { AgentManifest } from '@/lib/types';
import { AgentCard } from './AgentCard';

interface AgentRunFormProps {
  agents:   AgentManifest[];
  loading:  boolean;
  onSubmit: (task: string, selectedAgents: string[], useRag: boolean) => void;
}

export function AgentRunForm({ agents, loading, onSubmit }: AgentRunFormProps) {
  const [task,           setTask]           = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [useRag,         setUseRag]         = useState(false);

  function toggleAgent(id: string) {
    setSelectedAgents(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!task.trim() || loading) return;
    onSubmit(task.trim(), selectedAgents, useRag);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Dry-run notice */}
      <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-300">
        Mode dry-run actif — aucune action n&apos;est executee automatiquement. Validation humaine requise.
      </div>

      {/* Tache */}
      <div className="space-y-1">
        <label htmlFor="agent-task" className="text-xs font-semibold text-slate-400">
          Tache a analyser
        </label>
        <textarea
          id="agent-task"
          value={task}
          onChange={e => setTask(e.target.value)}
          placeholder="Ex : Analyser l'etat du systeme et proposer des optimisations..."
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
          disabled={loading}
        />
        <p className="text-right text-[10px] text-slate-600">{task.length}/2000</p>
      </div>

      {/* Agents */}
      {agents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400">
            Agents (laisser vide = tous les agents actifs)
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {agents.map(a => (
              <AgentCard
                key={a.id}
                agent={a}
                selected={selectedAgents.includes(a.id)}
                onToggle={toggleAgent}
              />
            ))}
          </div>
        </div>
      )}

      {/* Options */}
      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={useRag}
            onChange={e => setUseRag(e.target.checked)}
            className="rounded border-white/20 bg-white/5"
            disabled={loading}
          />
          Utiliser RAG (documentation locale)
        </label>
      </div>

      <button
        type="submit"
        disabled={!task.trim() || loading}
        className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-40"
      >
        {loading ? 'Execution en cours...' : 'Lancer les agents'}
      </button>
    </form>
  );
}
