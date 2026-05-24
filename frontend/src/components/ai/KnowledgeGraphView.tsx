'use client';

import type { KnowledgeGraphResponse } from '@/lib/types';

interface KnowledgeGraphViewProps {
  graph:    KnowledgeGraphResponse | null;
  loading?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  memory: '#7c3aed', rag: '#0369a1', workflow: '#0f766e',
  agent: '#b45309', diagnostic: '#dc2626', plugin: '#6d28d9',
  event: '#0891b2', note: '#4b5563',
};

export function KnowledgeGraphView({ graph, loading }: KnowledgeGraphViewProps) {
  if (loading) return <div style={{ color: '#888', padding: 16 }}>Generation du graphe...</div>;
  if (!graph)  return <div style={{ color: '#666', padding: 16 }}>Graphe non disponible.</div>;

  const { nodes, edges, totalNodes, totalEdges, generatedAt } = graph;

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, color: '#888', fontSize: 12 }}>
        <span>{totalNodes} noeuds</span>
        <span>{totalEdges} liens</span>
        <span>Genere le {new Date(generatedAt).toLocaleString('fr-FR')}</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              <th style={{ textAlign: 'left', padding: '4px 8px', color: '#888' }}>Noeud</th>
              <th style={{ textAlign: 'left', padding: '4px 8px', color: '#888' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '4px 8px', color: '#888' }}>Entites</th>
              <th style={{ textAlign: 'left', padding: '4px 8px', color: '#888' }}>Importance</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map(n => (
              <tr key={n.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '4px 8px', color: '#e0e0e0' }}>{n.title}</td>
                <td style={{ padding: '4px 8px' }}>
                  <span style={{ background: TYPE_COLORS[n.type] || '#444', color: '#fff', borderRadius: 3, padding: '1px 5px' }}>
                    {n.type}
                  </span>
                </td>
                <td style={{ padding: '4px 8px', color: '#a0a0d0' }}>{n.entities.join(', ')}</td>
                <td style={{ padding: '4px 8px', color: '#888' }}>{n.importance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edges.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Relations</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {edges.slice(0, 20).map((e, i) => (
              <span key={i} style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#a0a0c0' }}>
                {e.source.slice(0, 8)} <span style={{ color: '#555' }}>—{e.type}→</span> {e.target.slice(0, 8)}
              </span>
            ))}
            {edges.length > 20 && <span style={{ color: '#555', fontSize: 11 }}>+{edges.length - 20} autres</span>}
          </div>
        </div>
      )}
    </div>
  );
}
