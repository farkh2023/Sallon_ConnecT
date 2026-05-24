'use client';

import { useEffect, useState } from 'react';
import type { WidgetProps } from '../core/widgetTypes';
import type { SearchHistoryEntry } from '@/lib/types';

const HISTORY_KEY = 'sallon_search_history';

function loadHistory(): SearchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

export function RecentSearchesWidget({ size }: WidgetProps) {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { setHistory(loadHistory()); }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div style={{ padding: 12, background: '#0f0f1a', borderRadius: 8, color: '#e0e0e0' }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Recherches recentes</div>
      {history.length === 0 ? (
        <div style={{ color: '#555', fontSize: 11 }}>Aucune recherche recente.</div>
      ) : (
        <div>
          {history.slice(0, size === 'small' ? 3 : 6).map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a0a0c0', padding: '2px 0' }}>
              <span>🕐 {h.query}</span>
              <span style={{ color: '#555' }}>{h.total}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 10, color: '#444', marginTop: 6 }}>Local uniquement</div>
    </div>
  );
}
