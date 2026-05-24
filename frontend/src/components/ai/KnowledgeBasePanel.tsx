'use client';

import { useState } from 'react';
import { useKnowledge } from '@/hooks/useKnowledge';
import { KnowledgeSearchBox }    from './KnowledgeSearchBox';
import { KnowledgeResultsList }  from './KnowledgeResultsList';
import { KnowledgeFilters }      from './KnowledgeFilters';
import { KnowledgeGraphView }    from './KnowledgeGraphView';
import { KnowledgeSummaryPanel } from './KnowledgeSummaryPanel';
import type { KnowledgeGraphResponse, KnowledgeItem } from '@/lib/types';

type Tab = 'base' | 'search' | 'graph' | 'resume';

export function KnowledgeBasePanel() {
  const { items, meta, loading, error, enabled, loadItems, search, getGraph, summarize, reindex, clearAll } = useKnowledge();
  const [tab,           setTab]           = useState<Tab>('base');
  const [filters,       setFilters]       = useState({});
  const [searchResults, setSearchResults] = useState<KnowledgeItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [graph,         setGraph]         = useState<KnowledgeGraphResponse | null>(null);
  const [graphLoading,  setGraphLoading]  = useState(false);
  const [confirmClear,  setConfirmClear]  = useState(false);

  async function handleSearch(query: string) {
    setSearchLoading(true);
    const res = await search(query, filters);
    setSearchResults(res);
    setSearchLoading(false);
  }

  async function handleGraph() {
    setGraphLoading(true);
    const res = await getGraph(filters);
    setGraph(res);
    setGraphLoading(false);
  }

  async function handleReindex() {
    await reindex();
    await loadItems(filters);
  }

  async function handleClear() {
    if (!confirmClear) { setConfirmClear(true); return; }
    await clearAll();
    setConfirmClear(false);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'base',   label: 'Base' },
    { id: 'search', label: 'Recherche' },
    { id: 'graph',  label: 'Graphe' },
    { id: 'resume', label: 'Resumes' },
  ];

  return (
    <div style={{ background: '#0f0f1a', color: '#e0e0e0', borderRadius: 8, padding: 20, minHeight: 400 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#fff' }}>Base de connaissances locale</h2>
          {meta && (
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              {meta.totalItems} element{meta.totalItems !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ background: '#1e3a5f', color: '#60a5fa', borderRadius: 12, padding: '2px 10px', fontSize: 11 }}>
            Base locale uniquement
          </span>
          <span style={{ background: enabled ? '#1a3a1a' : '#3a1a1a', color: enabled ? '#4ade80' : '#f87171', borderRadius: 12, padding: '2px 10px', fontSize: 11 }}>
            {enabled ? 'KB active' : 'KB desactivee'}
          </span>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ background: '#3a1a1a', border: '1px solid #dc2626', borderRadius: 6, padding: 10, marginBottom: 12, color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #222' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '6px 16px', border: 'none', borderRadius: '4px 4px 0 0',
              background: tab === t.id ? '#1e1e3f' : 'transparent',
              color: tab === t.id ? '#a0a0ff' : '#666',
              cursor: 'pointer', fontWeight: tab === t.id ? 600 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <KnowledgeFilters value={filters} onChange={f => { setFilters(f); void loadItems(f); }} />

      {/* Tab content */}
      {tab === 'base' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={handleReindex} disabled={loading} style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #444', background: '#1e1e3f', color: '#c0c0ff', cursor: 'pointer', fontSize: 12 }}>
              Reindexer
            </button>
            <button onClick={handleClear} disabled={loading} style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #7f1d1d', background: '#2a0a0a', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>
              {confirmClear ? "Confirmer l'effacement ?" : 'Effacer la base'}
            </button>
            {confirmClear && (
              <button onClick={() => setConfirmClear(false)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #555', background: '#1a1a2e', color: '#888', cursor: 'pointer', fontSize: 12 }}>
                Annuler
              </button>
            )}
          </div>
          <KnowledgeResultsList items={items} loading={loading} emptyText="Base de connaissances vide." />
        </div>
      )}

      {tab === 'search' && (
        <div>
          <KnowledgeSearchBox onSearch={handleSearch} loading={searchLoading} />
          <KnowledgeResultsList items={searchResults} loading={searchLoading} emptyText="Lancez une recherche." />
        </div>
      )}

      {tab === 'graph' && (
        <div>
          <button onClick={handleGraph} disabled={graphLoading} style={{ marginBottom: 12, padding: '6px 16px', borderRadius: 4, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>
            Generer le graphe
          </button>
          <KnowledgeGraphView graph={graph} loading={graphLoading} />
        </div>
      )}

      {tab === 'resume' && (
        <KnowledgeSummaryPanel onSummarize={summarize} />
      )}
    </div>
  );
}
