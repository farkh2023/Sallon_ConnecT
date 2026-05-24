'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { WidgetProps } from '../core/widgetTypes';
import type { KnowledgeStatusResponse } from '@/lib/types';

export function KnowledgeStatusWidget({ size }: WidgetProps) {
  const [data, setData] = useState<KnowledgeStatusResponse | null>(null);

  useEffect(() => {
    apiGet<KnowledgeStatusResponse>('/api/ai/knowledge/status')
      .then(setData)
      .catch(() => {});
  }, []);

  const enabled = data?.enabled ?? false;
  const total   = data?.meta?.totalItems ?? 0;

  return (
    <div style={{ padding: 12, background: '#0f0f1a', borderRadius: 8, color: '#e0e0e0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🧠</span>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Base de connaissances</span>
        <span style={{ marginLeft: 'auto', background: enabled ? '#1a3a1a' : '#3a1a1a', color: enabled ? '#4ade80' : '#f87171', borderRadius: 10, padding: '1px 8px', fontSize: 11 }}>
          {enabled ? 'Active' : 'Inactif'}
        </span>
      </div>
      {size !== 'small' && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
          {total} element{total !== 1 ? 's' : ''} indexes
        </div>
      )}
      <div style={{ marginTop: 4, fontSize: 10, color: '#555' }}>Local uniquement</div>
    </div>
  );
}
