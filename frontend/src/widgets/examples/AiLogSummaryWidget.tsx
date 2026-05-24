'use client';

import { useState, useCallback } from 'react';
import { apiPost } from '@/lib/api';
import type { WidgetProps } from '../core/widgetTypes';
import type { AiChatResponse } from '@/lib/types';

const SAMPLE_LOG = `[ERROR] 2026-05-23 06:00:01 Port 3000 already in use
[WARN]  2026-05-23 06:00:02 Scheduler tick delayed by 200ms
[INFO]  2026-05-23 06:00:03 Backend started successfully`;

export function AiLogSummaryWidget({ size }: WidgetProps) {
  const [logs,    setLogs]    = useState('');
  const [result,  setResult]  = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const analyze = useCallback(async () => {
    const logText = logs.trim() || SAMPLE_LOG;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPost<AiChatResponse>('/api/ai/analyze-logs', { logs: logText });
      if (res.ok && res.response) {
        setResult(res.response);
      } else {
        setError(res.error ?? 'IA non disponible');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur reseau');
    } finally {
      setLoading(false);
    }
  }, [logs]);

  const compact = size === 'small';

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Analyse logs IA</span>
        <button
          type="button"
          onClick={() => void analyze()}
          disabled={loading}
          aria-label="Analyser les logs avec l'IA locale"
          className="rounded border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 transition hover:bg-emerald-400/20 disabled:opacity-40"
        >
          {loading ? '...' : 'Analyser'}
        </button>
      </div>

      {!compact && (
        <textarea
          value={logs}
          onChange={e => setLogs(e.target.value)}
          placeholder="Coller vos logs ici (laissez vide pour demo)"
          aria-label="Logs a analyser"
          rows={3}
          className="resize-none rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-300 placeholder-slate-600 focus:border-sky-400/40 focus:outline-none"
        />
      )}

      {error  && <p className="text-xs text-red-400 truncate" role="alert">{error}</p>}
      {result && (
        <div className="overflow-auto rounded bg-black/20 p-2 text-[10px] text-slate-300 max-h-28">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
      {!result && !error && !loading && (
        <p className="text-xs text-slate-600">{compact ? 'Cliquez Analyser.' : 'Collez des logs ou cliquez Analyser (demo).'}</p>
      )}
    </div>
  );
}
