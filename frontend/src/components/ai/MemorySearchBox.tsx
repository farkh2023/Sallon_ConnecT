'use client';

import { useState } from 'react';
import type { MemoryItem, MemoryItemType, MemoryScope } from '@/lib/types';

const TYPES:  MemoryItemType[] = ['preference', 'fact', 'summary', 'workflow-result', 'agent-result', 'diagnostic-insight', 'note'];
const SCOPES: MemoryScope[]   = ['user', 'project', 'system', 'session'];

interface MemorySearchBoxProps {
  onSearch: (query: string, filters: { type?: string; scope?: string }) => Promise<MemoryItem[]>;
}

export function MemorySearchBox({ onSearch }: MemorySearchBoxProps) {
  const [query,   setQuery]   = useState('');
  const [type,    setType]    = useState('');
  const [scope,   setScope]   = useState('');
  const [results, setResults] = useState<MemoryItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await onSearch(query.trim(), {
        type:  type  || undefined,
        scope: scope || undefined,
      });
      setResults(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-slate-400">Recherche memoire</p>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void handleSearch(); }}
          placeholder="Rechercher dans la memoire locale..."
          aria-label="Recherche dans la memoire"
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={loading || !query.trim()}
          aria-label="Lancer la recherche"
          className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-400 hover:bg-sky-500/20 disabled:opacity-40"
        >
          {loading ? '…' : 'Chercher'}
        </button>
      </div>

      <div className="flex gap-2">
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          aria-label="Filtrer par type"
          className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-slate-400"
        >
          <option value="">Tous types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={scope}
          onChange={e => setScope(e.target.value)}
          aria-label="Filtrer par portee"
          className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-slate-400"
        >
          <option value="">Toutes portees</option>
          {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {results !== null && (
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500">{results.length} resultat{results.length !== 1 ? 's' : ''}</p>
          {results.length === 0 ? (
            <p className="text-xs text-slate-600">Aucun resultat pour cette recherche.</p>
          ) : (
            <ul className="space-y-1">
              {results.map(item => (
                <li key={item.id} className="rounded-lg border border-white/8 bg-white/3 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-white/5 px-1 py-0.5 text-[10px] text-slate-500">{item.type}</span>
                    {item._score !== undefined && (
                      <span className="text-[10px] text-slate-600">score {item._score.toFixed(1)}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-300 line-clamp-2">{item.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
