'use client';

import type { SearchResult } from '@/lib/types';

const TYPE_ICONS: Record<string, string> = {
  knowledge: '🧠', memory: '💭', rag: '📚', agent: '🤖',
  workflow: '⚙️', plugin: '🔌', doc: '📄', diagnostic: '🩺', command: '⚡',
};

const TYPE_COLORS: Record<string, string> = {
  knowledge: '#7c3aed', memory: '#0369a1', rag: '#0891b2',
  agent: '#b45309', workflow: '#0f766e', plugin: '#6d28d9',
  doc: '#374151', diagnostic: '#dc2626', command: '#1d4ed8',
};

interface SearchResultsListProps {
  groups:    Record<string, SearchResult[]>;
  results:   SearchResult[];
  selected?: number;
  onSelect:  (result: SearchResult, index: number) => void;
  loading?:  boolean;
  query?:    string;
}

export function SearchResultsList({ groups, results, selected, onSelect, loading, query }: SearchResultsListProps) {
  if (loading) return <div style={{ padding: 20, color: '#888', textAlign: 'center' }}>Recherche...</div>;

  if (!query && results.length === 0) return null;

  if (query && results.length === 0) {
    return <div style={{ padding: 20, color: '#666', textAlign: 'center' }}>{`Aucun resultat pour "${query}".`}</div>;
  }

  let globalIndex = 0;
  const sections = Object.entries(groups);

  return (
    <div style={{ overflowY: 'auto', maxHeight: 400 }}>
      {sections.map(([type, items]) => (
        <div key={type}>
          <div style={{ padding: '6px 14px 2px', fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>
            {TYPE_ICONS[type] || '•'} {type}
          </div>
          {items.map(item => {
            const idx = globalIndex++;
            const isSelected = idx === selected;
            return (
              <div
                key={item.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(item, idx)}
                onKeyDown={e => e.key === 'Enter' && onSelect(item, idx)}
                tabIndex={0}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '8px 14px', cursor: 'pointer',
                  background: isSelected ? '#1e1e3f' : 'transparent',
                  borderLeft: isSelected ? `3px solid ${TYPE_COLORS[type] || '#444'}` : '3px solid transparent',
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{TYPE_ICONS[type] || '•'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#e0e0e0', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.description}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: '#555', flexShrink: 0 }}>
                  {(item.score || 0).toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ padding: '6px 14px', fontSize: 10, color: '#444', borderTop: '1px solid #1a1a2e' }}>
        {results.length} resultat{results.length > 1 ? 's' : ''} — Recherche locale uniquement
      </div>
    </div>
  );
}
