'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import type { WidgetProps } from '../core/widgetTypes';
import type { RagAskResponse } from '@/lib/types';

export function RagAskWidget({ size }: WidgetProps) {
  const [question, setQuestion] = useState('');
  const [result,   setResult]   = useState<RagAskResponse | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleAsk() {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPost<RagAskResponse>('/api/ai/rag/ask', { question: trimmed });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur RAG');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <span className="text-xs text-slate-500">Question documentation</span>

      {size !== 'small' && (
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void handleAsk(); }}
          disabled={loading}
          placeholder="Question sur la documentation..."
          aria-label="Question pour le RAG local"
          className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none disabled:opacity-40"
        />
      )}

      <button
        type="button"
        onClick={() => void handleAsk()}
        disabled={loading || !question.trim()}
        aria-label="Lancer la question RAG"
        className="self-start rounded border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400 transition hover:bg-sky-400/20 disabled:opacity-40"
      >
        {loading ? 'Recherche...' : 'Demander'}
      </button>

      {error && <p className="text-[10px] text-red-400">{error}</p>}

      {result && result.ok && result.response && (
        <p className="text-[10px] leading-relaxed text-slate-400 line-clamp-4">
          {result.response}
        </p>
      )}

      {result && !result.ok && (
        <p className="text-[10px] text-amber-400">{result.error}</p>
      )}

      {result?.citations && result.citations.length > 0 && (
        <p className="text-[9px] text-slate-700">
          {result.citations.length} source(s) — {result.mode}
        </p>
      )}
    </div>
  );
}
