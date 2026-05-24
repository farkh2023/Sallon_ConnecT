'use client';

import { useState, useCallback } from 'react';
import { apiPost } from '@/lib/api';
import type { WidgetProps } from '../core/widgetTypes';
import type { AiChatResponse } from '@/lib/types';

export function AiDiagnosticsWidget({ size }: WidgetProps) {
  const [result,  setResult]  = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPost<AiChatResponse>('/api/ai/diagnose', {});
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
  }, []);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Diagnostic IA</span>
        <button
          type="button"
          onClick={() => void analyze()}
          disabled={loading}
          aria-label="Lancer l'analyse des diagnostics par l'IA"
          className="rounded border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400 transition hover:bg-sky-400/20 disabled:opacity-40"
        >
          {loading ? '...' : 'Analyser'}
        </button>
      </div>
      {error  && <p className="text-xs text-red-400 truncate" role="alert">{error}</p>}
      {result && (
        <div className={`overflow-auto rounded bg-black/20 p-2 text-[10px] text-slate-300 ${size === 'small' ? 'max-h-20' : 'max-h-40'}`}>
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
      {!result && !error && !loading && (
        <p className="text-xs text-slate-600">Cliquez Analyser pour une analyse IA du systeme.</p>
      )}
      <p className="mt-auto text-[9px] text-slate-700">Dry-run — aucune execution automatique</p>
    </div>
  );
}
