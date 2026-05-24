'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import type { WidgetProps } from '../core/widgetTypes';
import type { KnowledgeSearchResponse, KnowledgeItem } from '@/lib/types';

export function KnowledgeSearchWidget({ size }: WidgetProps) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await apiPost<KnowledgeSearchResponse>('/api/ai/knowledge/search', { query: query.trim(), topK: 5 });
      setResults(res.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 12, background: '#0f0f1a', borderRadius: 8, color: '#e0e0e0' }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Recherche Knowledge</div>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <input
          aria-label="Recherche knowledge widget"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher..."
          disabled={loading}
          style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid #444', background: '#1a1a2e', color: '#e0e0e0', fontSize: 12 }}
        />
        <button type="submit" disabled={loading || !query.trim()} style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
          {loading ? '...' : 'OK'}
        </button>
      </form>
      {results.length > 0 && size !== 'small' && (
        <div>
          {results.slice(0, 3).map(r => (
            <div key={r.id} style={{ borderBottom: '1px solid #222', paddingBottom: 4, marginBottom: 4 }}>
              <div style={{ fontSize: 12, color: '#c0c0ff' }}>{r.title}</div>
              <div style={{ fontSize: 10, color: '#666' }}>{r.type}</div>
            </div>
          ))}
          {results.length > 3 && <div style={{ fontSize: 10, color: '#555' }}>+{results.length - 3} autres</div>}
        </div>
      )}
    </div>
  );
}
