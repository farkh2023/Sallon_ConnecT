'use client';

import { useState } from 'react';
import type { RagAskResponse } from '@/lib/types';
import { RagCitationsList } from './RagCitationsList';

interface Props {
  indexed:   boolean;
  aiEnabled: boolean;
  loading:   boolean;
  onAsk:     (question: string) => Promise<RagAskResponse | null>;
}

export function RagAskBox({ indexed, aiEnabled, loading, onAsk }: Props) {
  const [question, setQuestion] = useState('');
  const [result,   setResult]   = useState<RagAskResponse | null>(null);

  const disabled = !indexed || !aiEnabled || loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || disabled) return;
    const res = await onAsk(trimmed);
    setResult(res);
  }

  function disabledReason(): string {
    if (!indexed)   return 'Indexez la documentation d\'abord.';
    if (!aiEnabled) return 'Activez l\'IA locale (SALLON_AI_ENABLED=true).';
    return '';
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          disabled={disabled}
          rows={2}
          placeholder={disabled ? disabledReason() : 'Posez une question sur Sallon-ConnecT...'}
          aria-label="Question pour le RAG local"
          className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-sky-400/40 focus:outline-none disabled:opacity-40"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={disabled || !question.trim()}
            aria-label="Poser la question au RAG local"
            className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold text-sky-400 transition hover:bg-sky-400/20 disabled:opacity-40"
          >
            {loading ? 'Recherche...' : 'Demander'}
          </button>
          {result && (
            <button
              type="button"
              onClick={() => setResult(null)}
              className="text-[10px] text-slate-600 hover:text-slate-400"
            >
              Effacer
            </button>
          )}
        </div>
      </form>

      {result && (
        <div className="space-y-3">
          {result.ok && result.response ? (
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-300">
                {result.response}
              </p>
            </div>
          ) : (
            <p className="text-xs text-red-400">{result.error ?? 'Erreur inconnue.'}</p>
          )}
          {result.citations && result.citations.length > 0 && (
            <RagCitationsList citations={result.citations} mode={result.mode} />
          )}
        </div>
      )}

      <p className="text-[9px] text-slate-700">
        RAG local uniquement — reponses basees sur la documentation locale, avec citations.
      </p>
    </div>
  );
}
