'use client';

import type { WorkflowRunResult } from '@/lib/types';
import { WorkflowRunTimeline } from './WorkflowRunTimeline';

interface WorkflowRunPanelProps {
  result:    WorkflowRunResult;
  onClear:   () => void;
}

export function WorkflowRunPanel({ result, onClear }: WorkflowRunPanelProps) {
  return (
    <div className="space-y-4">
      {/* En-tete run */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-300">{result.workflowName}</p>
          <p className="text-[10px] text-slate-600">Run <code>{result.runId}</code></p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${
            result.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {result.status}
          </span>
          <button
            type="button"
            onClick={onClear}
            aria-label="Effacer les resultats du run"
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-400 hover:text-slate-200"
          >
            Effacer
          </button>
        </div>
      </div>

      {/* Synthese */}
      {result.summary && (
        <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
          <p className="text-xs font-semibold text-slate-400 mb-1">Synthese</p>
          <p className="text-xs text-slate-300 whitespace-pre-wrap">{result.summary}</p>
        </div>
      )}

      {/* Safety summary */}
      {result.safetySummary && (
        <div className="flex flex-wrap gap-2">
          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">Local uniquement</span>
          <span className="rounded bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-400">Dry-run</span>
          <span className="rounded bg-white/8 px-2 py-0.5 text-[10px] text-slate-500">
            {result.safetySummary.nodesRun} nodes — {result.safetySummary.nodesFailed} echoues
          </span>
          {result.safetySummary.rejectedTotal > 0 && (
            <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400">
              {result.safetySummary.rejectedTotal} rejets
            </span>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-400">Timeline</p>
        <WorkflowRunTimeline
          nodeResults={result.nodeResults}
          citations={result.citations}
          rejectedActions={result.rejectedActions}
        />
      </div>
    </div>
  );
}
