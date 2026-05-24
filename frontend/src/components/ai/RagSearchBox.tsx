'use client';

import { useState } from 'react';
import type { RagSearchResponse } from '@/lib/types';
import { RagCitationsList } from './RagCitationsList';

interface Props {
  indexed:  boolean;
  loading:  boolean;
  onSearch: (query: string) => Promise<RagSearchResponse | null>;
}

export function RagSearchBox({ indexed, loading, onSearch }: Props) {
  const [query,  setQuery]  = useState('');
  const [result, setResult] = useState<RagSearchResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    const res = await onSearch(trimmed);
    setResult(res);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={!indexed || loading}
          placeholder={indexed ? 'Rechercher dans la documentation...' : 'Index non disponible'}
          aria-label="Recherche dans la documentation locale"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:border-sky-400/40 focus:outline-none disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!indexed || loading || !query.trim()}
          aria-label="Lancer la recherche RAG"
          className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold text-sky-400 transition hover:bg-sky-400/20 disabled:opacity-40"
        >
          Chercher
        </button>
      </form>
      {result && (
        <div className="space-y-2">
          {result.total === 0 ? (
            <p className="text-xs text-slate-500">Aucun resultat pour &laquo;{result.query}&raquo;.</p>
          ) : (
            <RagCitationsList citations={result.chunks} mode={result.mode} />
          )}
        </div>
      )}
    </div>
  );
}
