'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import type { WidgetProps } from '../core/widgetTypes';
import type { KnowledgeGraphResponse } from '@/lib/types';

export function KnowledgeGraphWidget({ size }: WidgetProps) {
  const [graph,   setGraph]   = useState<KnowledgeGraphResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await apiPost<KnowledgeGraphResponse>('/api/ai/knowledge/graph', {});
      setGraph(res);
    } catch {
      setGraph(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 12, background: '#0f0f1a', borderRadius: 8, color: '#e0e0e0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Graphe Knowledge</span>
        <button onClick={handleGenerate} disabled={loading} style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid #444', background: '#1e1e3f', color: '#c0c0ff', cursor: 'pointer', fontSize: 11 }}>
          {loading ? '...' : 'Generer'}
        </button>
      </div>
      {graph && (
        <div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#888' }}>
            <span>{graph.totalNodes} noeuds</span>
            <span>{graph.totalEdges} liens</span>
          </div>
          {size !== 'small' && graph.nodes.slice(0, 5).map(n => (
            <div key={n.id} style={{ fontSize: 11, color: '#a0a0c0', marginTop: 3 }}>
              [{n.type}] {n.title}
            </div>
          ))}
          {size !== 'small' && graph.nodes.length > 5 && (
            <div style={{ fontSize: 10, color: '#555' }}>+{graph.nodes.length - 5} autres</div>
          )}
        </div>
      )}
      {!graph && !loading && (
        <div style={{ color: '#555', fontSize: 12 }}>Cliquez pour generer le graphe.</div>
      )}
    </div>
  );
}
