'use client';

import { useState } from 'react';
import type { KnowledgeSummaryResponse, KnowledgeCategorySummary } from '@/lib/types';

const CATEGORIES = ['project', 'workflows', 'memory', 'diagnostics', 'agents', 'plugins'];

interface KnowledgeSummaryPanelProps {
  onSummarize: (category?: string) => Promise<KnowledgeSummaryResponse | KnowledgeCategorySummary | null>;
}

export function KnowledgeSummaryPanel({ onSummarize }: KnowledgeSummaryPanelProps) {
  const [loading,   setLoading]   = useState(false);
  const [summaries, setSummaries] = useState<Record<string, KnowledgeCategorySummary>>({});
  const [selected,  setSelected]  = useState<string>('');

  async function handleSummarize(category?: string) {
    setLoading(true);
    try {
      const res = await onSummarize(category);
      if (!res) return;
      if ('summaries' in res) {
        setSummaries(res.summaries);
      } else {
        setSummaries(prev => ({ ...prev, [(res as KnowledgeCategorySummary).category]: res as KnowledgeCategorySummary }));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => handleSummarize()}
          disabled={loading}
          style={{ padding: '6px 14px', borderRadius: 4, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}
        >
          Tout resumer
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setSelected(cat); void handleSummarize(cat); }}
            disabled={loading}
            style={{
              padding: '4px 10px', borderRadius: 4, border: '1px solid #555',
              background: selected === cat ? '#1e1e3f' : '#1a1a2e',
              color: '#c0c0e0', cursor: 'pointer', fontSize: 12,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: '#888' }}>Generation des resumes...</div>}

      {Object.values(summaries).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.values(summaries).map(s => (
            <div key={s.category} style={{ border: '1px solid #2a2a3e', borderRadius: 6, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#a0a0e0', fontWeight: 600, textTransform: 'capitalize' }}>{s.category}</span>
                <span style={{ fontSize: 11, color: '#666' }}>{s.method} · {s.items} elements</span>
              </div>
              <div style={{ color: '#c0c0c0', fontSize: 13, lineHeight: 1.5 }}>{s.summary}</div>
            </div>
          ))}
        </div>
      )}

      {!loading && Object.values(summaries).length === 0 && (
        <div style={{ color: '#666', textAlign: 'center', padding: 24 }}>
          Cliquez sur une categorie pour generer un resume.
        </div>
      )}
    </div>
  );
}
