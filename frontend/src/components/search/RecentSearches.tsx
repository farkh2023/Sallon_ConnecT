'use client';

import { useState } from 'react';
import type { SearchHistoryEntry } from '@/lib/types';

interface RecentSearchesProps {
  history:      SearchHistoryEntry[];
  onSelect:     (query: string) => void;
  onClear:      () => void;
}

export function RecentSearches({ history, onSelect, onClear }: RecentSearchesProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  if (history.length === 0) {
    return <div style={{ padding: '8px 14px', color: '#555', fontSize: 12 }}>Aucune recherche recente.</div>;
  }

  function handleClear() {
    if (!confirmClear) { setConfirmClear(true); return; }
    onClear();
    setConfirmClear(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px 2px' }}>
        <span style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>Recherches recentes</span>
        <button
          onClick={handleClear}
          style={{ fontSize: 10, color: confirmClear ? '#f87171' : '#555', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {confirmClear ? 'Confirmer effacement ?' : 'Effacer'}
        </button>
      </div>
      {history.slice(0, 8).map((entry, i) => (
        <div
          key={i}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(entry.query)}
          onKeyDown={e => e.key === 'Enter' && onSelect(entry.query)}
          style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 14px', cursor: 'pointer', color: '#a0a0c0', fontSize: 12 }}
        >
          <span>🕐 {entry.query}</span>
          <span style={{ color: '#555', fontSize: 10 }}>{entry.total} res.</span>
        </div>
      ))}
    </div>
  );
}
