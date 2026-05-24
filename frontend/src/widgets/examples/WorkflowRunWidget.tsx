'use client';

import { useState } from 'react';
import type { WidgetProps } from '../core/widgetTypes';
import type { WorkflowRunResult } from '@/lib/types';
import { apiPost } from '@/lib/api';

export function WorkflowRunWidget({ size }: WidgetProps) {
  const [running,    setRunning]    = useState(false);
  const [result,     setResult]     = useState<WorkflowRunResult | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [workflowId, setWorkflowId] = useState('');

  async function handleRun() {
    if (!workflowId.trim()) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPost<WorkflowRunResult>(`/api/ai/workflows/${workflowId.trim()}/run`, {});
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur workflow');
    } finally {
      setRunning(false);
    }
  }

  const statusColor = result
    ? result.status === 'completed' ? 'text-emerald-400' : 'text-red-400'
    : 'text-slate-500';

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Exécuter workflow</span>
        <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-400">dry-run</span>
      </div>

      <div className="flex gap-1">
        <input
          type="text"
          value={workflowId}
          onChange={e => setWorkflowId(e.target.value)}
          placeholder="ID du workflow"
          aria-label="ID du workflow à exécuter"
          className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          disabled={running}
        />
        <button
          type="button"
          onClick={() => void handleRun()}
          disabled={running || !workflowId.trim()}
          aria-label="Lancer le workflow"
          className="rounded border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-xs text-sky-400 hover:bg-sky-500/20 disabled:opacity-40"
        >
          {running ? '…' : '▶'}
        </button>
      </div>

      {error && (
        <p className="text-[10px] text-red-400 truncate" role="alert">{error}</p>
      )}

      {result && (
        <div className="space-y-1">
          <span className={`text-xs font-semibold ${statusColor}`}>
            {result.status === 'completed' ? 'Terminé' : 'Échoué'}
          </span>
          {size !== 'small' && result.summary && (
            <p className="text-[10px] text-slate-500 line-clamp-2">{result.summary}</p>
          )}
          <div className="flex gap-1">
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">
              {result.nodeResults?.length ?? 0} nœuds
            </span>
            {(result.rejectedActions?.length ?? 0) > 0 && (
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">
                {result.rejectedActions.length} rejetées
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
