'use client';

import { useState, useEffect, useRef } from 'react';
import { apiGet } from '@/lib/api';
import type { WidgetProps } from '../core/widgetTypes';
import type { WorkspaceStatusResponse } from '@/lib/types';

export function WorkspaceStatusWidget({ size }: WidgetProps) {
  const [status,  setStatus]  = useState<WorkspaceStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiGet<WorkspaceStatusResponse>('/api/workspaces/status');
        if (mounted.current) { setStatus(res); setLoading(false); }
      } catch {
        if (mounted.current) setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 12, background: '#0f0f1a', borderRadius: 8, color: '#e0e0e0' }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Workspaces</div>
      {loading && <div style={{ fontSize: 11, color: '#555' }}>Chargement...</div>}
      {!loading && status && (
        <>
          <div style={{ fontSize: 12, color: '#a0a0ff', marginBottom: 4 }}>
            Actif : <strong>{status.current ?? '-'}</strong>
          </div>
          {size !== 'small' && (
            <div style={{ fontSize: 11, color: '#888' }}>
              Total : {status.total} &middot; {status.enabled ? 'Actif' : 'Desactive'}
            </div>
          )}
        </>
      )}
      {!loading && !status && <div style={{ fontSize: 11, color: '#555' }}>Indisponible</div>}
      <div style={{ fontSize: 10, color: '#444', marginTop: 6 }}>Local uniquement</div>
    </div>
  );
}
