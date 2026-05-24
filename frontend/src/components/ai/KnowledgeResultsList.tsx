'use client';

import type { KnowledgeItem } from '@/lib/types';
import { KnowledgeEntityCard } from './KnowledgeEntityCard';

interface KnowledgeResultsListProps {
  items:     KnowledgeItem[];
  loading?:  boolean;
  onSelect?: (item: KnowledgeItem) => void;
  emptyText?: string;
}

export function KnowledgeResultsList({ items, loading, onSelect, emptyText }: KnowledgeResultsListProps) {
  if (loading) {
    return <div style={{ color: '#888', padding: 16 }}>Chargement...</div>;
  }
  if (items.length === 0) {
    return (
      <div style={{ color: '#666', padding: 16, textAlign: 'center' }}>
        {emptyText || 'Aucun element.'}
      </div>
    );
  }
  return (
    <div>
      {items.map(item => (
        <KnowledgeEntityCard key={item.id} item={item} onClick={onSelect} />
      ))}
      <div style={{ color: '#555', fontSize: 11, marginTop: 4 }}>
        {items.length} element{items.length > 1 ? 's' : ''}
      </div>
    </div>
  );
}
