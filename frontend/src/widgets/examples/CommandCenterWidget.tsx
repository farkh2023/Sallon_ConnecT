'use client';

import { useState } from 'react';
import { CommandCenterModal } from '@/components/search/CommandCenterModal';
import type { WidgetProps } from '../core/widgetTypes';

export function CommandCenterWidget({ size }: WidgetProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ padding: 12, background: '#0f0f1a', borderRadius: 8, color: '#e0e0e0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: size !== 'small' ? 8 : 0 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Command Center</span>
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le command center"
          style={{ padding: '4px 12px', borderRadius: 4, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 12 }}
        >
          Ctrl+K
        </button>
      </div>
      {size !== 'small' && (
        <div style={{ fontSize: 11, color: '#666' }}>
          Recherche globale · 15 commandes rapides · Local uniquement
        </div>
      )}
      <CommandCenterModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
