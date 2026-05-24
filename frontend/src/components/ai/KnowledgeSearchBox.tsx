'use client';

import { useState } from 'react';

interface KnowledgeSearchBoxProps {
  onSearch: (query: string) => void;
  loading?: boolean;
}

export function KnowledgeSearchBox({ onSearch, loading }: KnowledgeSearchBoxProps) {
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <input
        aria-label="Recherche dans la base de connaissances"
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Rechercher dans la base de connaissances..."
        disabled={loading}
        style={{
          flex: 1, padding: '8px 12px', borderRadius: 6,
          border: '1px solid #444', background: '#1a1a2e',
          color: '#e0e0e0', fontSize: 14,
        }}
      />
      <button
        type="submit"
        disabled={loading || !query.trim()}
        style={{
          padding: '8px 16px', borderRadius: 6, border: 'none',
          background: loading ? '#333' : '#4f46e5', color: '#fff',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '...' : 'Rechercher'}
      </button>
    </form>
  );
}
