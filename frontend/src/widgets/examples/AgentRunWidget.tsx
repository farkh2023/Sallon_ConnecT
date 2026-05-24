'use client';

import { useState } from 'react';
import type { WidgetProps } from '../core/widgetTypes';
import type { AgentRunResult } from '@/lib/types';
import { apiPost } from '@/lib/api';

export function AgentRunWidget({ size }: WidgetProps) {
  const [task,    setTask]    = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<AgentRunResult | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  async function handleRun() {
    if (!task.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiPost<AgentRunResult>('/api/ai/agents/run', {
        task: task.trim(), dryRun: true,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur agents');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <span className="text-xs text-slate-500">Agents — tache rapide</span>

      <div className="flex gap-1">
        <input
          type="text"
          value={task}
          onChange={e => setTask(e.target.value)}
          placeholder="Tache..."
          maxLength={500}
          aria-label="Tache pour les agents"
          className="flex-1 min-w-0 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
          disabled={loading}
          onKeyDown={e => e.key === 'Enter' && void handleRun()}
        />
        <button
          type="button"
          onClick={() => void handleRun()}
          disabled={!task.trim() || loading}
          aria-label="Lancer les agents"
          className="rounded bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-500 disabled:opacity-40"
        >
          {loading ? '...' : '▶'}
        </button>
      </div>

      {error && <p className="text-xs text-red-400" role="alert">{error}</p>}

      {result && (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${result.ok ? 'bg-emerald-400' : 'bg-red-400'}`} aria-hidden />
            <span className="text-[10px] text-slate-400">
              {result.agentsUsed?.length ?? 0} agents — dry-run
            </span>
          </div>
          {size !== 'small' && result.summary && (
            <p className="text-[11px] text-slate-400 line-clamp-3">{result.summary}</p>
          )}
        </div>
      )}
    </div>
  );
}
