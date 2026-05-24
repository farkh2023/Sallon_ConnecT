'use client';

import { useRef } from 'react';

interface GlobalSearchBoxProps {
  value:     string;
  onChange:  (v: string) => void;
  onSearch:  (v: string) => void;
  loading?:  boolean;
  autoFocus?: boolean;
}

export function GlobalSearchBox({ value, onChange, onSearch, loading, autoFocus }: GlobalSearchBoxProps) {
  const ref = useRef<HTMLInputElement>(null);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && value.trim()) onSearch(value.trim());
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #222' }}>
      <span style={{ color: '#666', fontSize: 16 }}>🔍</span>
      <input
        ref={ref}
        aria-label="Recherche globale"
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Rechercher dans Sallon-ConnecT..."
        disabled={loading}
        autoFocus={autoFocus}
        style={{
          flex: 1, border: 'none', outline: 'none',
          background: 'transparent', color: '#e0e0e0', fontSize: 15,
        }}
      />
      {loading && <span style={{ color: '#666', fontSize: 12 }}>...</span>}
    </div>
  );
}
