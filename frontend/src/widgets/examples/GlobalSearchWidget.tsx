'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import type { WidgetProps } from '../core/widgetTypes';
import type { SearchResponse } from '@/lib/types';

export function GlobalSearchWidget({ size }: WidgetProps) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<{ title: string; type: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await apiPost<SearchResponse>('/api/search', { query: query.trim(), topK: 5 });
      setResults((res.results || []).map(r => ({ title: r.title, type: r.type })));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 12, background: '#0f0f1a', borderRadius: 8, color: '#e0e0e0' }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Recherche globale</div>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input
          aria-label="Recherche globale widget"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher..."
          disabled={loading}
          style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid #444', background: '#1a1a2e', color: '#e0e0e0', fontSize: 12 }}
        />
        <button type="submit" disabled={loading || !query.trim()} style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
          {loading ? '...' : '🔍'}
        </button>
      </form>
      {results.length > 0 && size !== 'small' && (
        <div>
          {results.slice(0, 4).map((r, i) => (
            <div key={i} style={{ fontSize: 11, color: '#a0a0c0', padding: '2px 0', borderBottom: '1px solid #1a1a2e' }}>
              [{r.type}] {r.title}
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 10, color: '#444', marginTop: 4 }}>Local uniquement</div>
    </div>
  );
}
