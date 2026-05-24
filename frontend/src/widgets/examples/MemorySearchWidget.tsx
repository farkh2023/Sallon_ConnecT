'use client';

import { useState } from 'react';
import type { WidgetProps } from '../core/widgetTypes';
import type { MemoryItem } from '@/lib/types';
import { apiPost } from '@/lib/api';

export function MemorySearchWidget({ size: _size }: WidgetProps) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<MemoryItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<{ results: MemoryItem[]; total: number }>('/api/ai/memory/search', {
        query: query.trim(),
        topK:  5,
      });
      setResults(res.results || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur recherche');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <span className="text-xs text-slate-500">Recherche memoire IA</span>

      <div className="flex gap-1">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void handleSearch(); }}
          placeholder="Chercher dans la memoire..."
          aria-label="Requete de recherche memoire"
          className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={loading || !query.trim()}
          aria-label="Rechercher dans la memoire"
          className="rounded border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-xs text-sky-400 hover:bg-sky-500/20 disabled:opacity-40"
        >
          {loading ? '…' : '↵'}
        </button>
      </div>

      {error && <p className="text-[10px] text-red-400" role="alert">{error}</p>}

      {results !== null && (
        <div className="space-y-1 overflow-auto">
          {results.length === 0 ? (
            <p className="text-[10px] text-slate-600">Aucun resultat.</p>
          ) : (
            results.slice(0, 3).map(item => (
              <div key={item.id} className="rounded border border-white/8 bg-white/3 px-2 py-1.5">
                <span className="text-[10px] text-slate-500">{item.type}/{item.scope}</span>
                <p className="text-xs text-slate-300 line-clamp-2">{item.content}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
