'use client';

import type { KnowledgeItem } from '@/lib/types';

const TYPE_COLORS: Record<string, string> = {
  memory:     '#7c3aed',
  rag:        '#0369a1',
  workflow:   '#0f766e',
  agent:      '#b45309',
  diagnostic: '#dc2626',
  plugin:     '#6d28d9',
  event:      '#0891b2',
  note:       '#4b5563',
};

interface KnowledgeEntityCardProps {
  item:     KnowledgeItem;
  onClick?: (item: KnowledgeItem) => void;
}

export function KnowledgeEntityCard({ item, onClick }: KnowledgeEntityCardProps) {
  const color = TYPE_COLORS[item.type] || '#4b5563';
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(item)}
      onKeyDown={e => e.key === 'Enter' && onClick?.(item)}
      style={{
        border: `1px solid ${color}44`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 6,
        padding: '10px 14px',
        marginBottom: 8,
        cursor: onClick ? 'pointer' : 'default',
        background: '#12121e',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ background: color, color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>
          {item.type}
        </span>
        <span style={{ color: '#e0e0e0', fontWeight: 600, fontSize: 13 }}>{item.title}</span>
        <span style={{ marginLeft: 'auto', color: '#888', fontSize: 11 }}>
          importance: {item.importance}
        </span>
      </div>

      {item.entities && item.entities.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
          {item.entities.map(e => (
            <span key={e} style={{ background: '#1e2035', border: '1px solid #333', borderRadius: 3, padding: '1px 5px', fontSize: 10, color: '#a0a0d0' }}>
              {e}
            </span>
          ))}
        </div>
      )}

      {item.tags && item.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {item.tags.map(t => (
            <span key={t} style={{ background: '#1a2035', borderRadius: 3, padding: '1px 5px', fontSize: 10, color: '#6080a0' }}>
              #{t}
            </span>
          ))}
        </div>
      )}

      {item.relations && item.relations.length > 0 && (
        <div style={{ marginTop: 4, color: '#666', fontSize: 11 }}>
          {item.relations.length} relation{item.relations.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
