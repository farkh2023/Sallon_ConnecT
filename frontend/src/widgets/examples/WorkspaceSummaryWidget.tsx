'use client';

import { useState, useEffect, useRef } from 'react';
import { apiGet } from '@/lib/api';
import type { WidgetProps } from '../core/widgetTypes';
import type { WorkspaceProfile } from '@/lib/types';

export function WorkspaceSummaryWidget({ size }: WidgetProps) {
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiGet<{ ok: boolean; current: WorkspaceProfile | null; id: string }>('/api/workspaces/current');
        if (mounted.current) { setProfile(res.current ?? null); setLoading(false); }
      } catch {
        if (mounted.current) setLoading(false);
      }
    })();
  }, []);

  const s = profile?.settings;

  return (
    <div style={{ padding: 12, background: '#0f0f1a', borderRadius: 8, color: '#e0e0e0' }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Workspace actif</div>
      {loading && <div style={{ fontSize: 11, color: '#555' }}>Chargement...</div>}
      {!loading && !profile && <div style={{ fontSize: 11, color: '#555' }}>Aucun workspace actif.</div>}
      {!loading && profile && (
        <>
          <div style={{ fontSize: 13, color: '#a0a0ff', fontWeight: 600, marginBottom: 4 }}>{profile.name}</div>
          {profile.description && size !== 'small' && (
            <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{profile.description}</div>
          )}
          {size !== 'small' && s && (
            <div style={{ fontSize: 11, color: '#666' }}>
              <span>Theme: {s.theme}</span> &middot; <span>Langue: {s.language}</span><br />
              <span>IA: {s.aiEnabled ? 'oui' : 'non'}</span>
              {' '}&middot;<span> RAG: {s.ragEnabled ? 'oui' : 'non'}</span>
              {' '}&middot;<span> Memoire: {s.memoryEnabled ? 'oui' : 'non'}</span>
            </div>
          )}
          {profile.isDefault && (
            <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>Workspace par defaut</div>
          )}
        </>
      )}
      <div style={{ fontSize: 10, color: '#444', marginTop: 6 }}>Local uniquement</div>
    </div>
  );
}
