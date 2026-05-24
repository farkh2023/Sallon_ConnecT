'use client';

import { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import type { WidgetProps } from '../core/widgetTypes';
import type { WorkspaceProfile, WorkspaceListResponse } from '@/lib/types';
import { setStoredWorkspaceId } from '@/lib/workspaceStorage';

export function WorkspaceSwitcherWidget({ size: _size }: WidgetProps) {
  const [profiles,   setProfiles]   = useState<WorkspaceProfile[]>([]);
  const [currentId,  setCurrentId]  = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [switching,  setSwitching]  = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiGet<WorkspaceListResponse>('/api/workspaces');
        if (mounted.current) {
          setProfiles(res.profiles || []);
          setCurrentId(res.current ?? null);
          setStoredWorkspaceId(res.current ?? null);
          setLoading(false);
        }
      } catch {
        if (mounted.current) setLoading(false);
      }
    })();
  }, []);

  async function handleSwitch(id: string) {
    if (id === currentId || switching) return;
    setSwitching(true);
    try {
      await apiPost('/api/workspaces/switch', { id });
      if (mounted.current) {
        setCurrentId(id);
        setStoredWorkspaceId(id);
      }
    } catch {}
    finally { if (mounted.current) setSwitching(false); }
  }

  return (
    <div style={{ padding: 12, background: '#0f0f1a', borderRadius: 8, color: '#e0e0e0' }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Switcher workspace</div>
      {loading && <div style={{ fontSize: 11, color: '#555' }}>Chargement...</div>}
      {!loading && profiles.length === 0 && <div style={{ fontSize: 11, color: '#555' }}>Aucun workspace.</div>}
      {!loading && profiles.length > 0 && (
        <select
          value={currentId ?? ''}
          onChange={e => { void handleSwitch(e.target.value); }}
          disabled={switching}
          style={{
            width: '100%', padding: '5px 8px', borderRadius: 4,
            border: '1px solid #333', background: '#1a1a2e', color: '#e0e0e0', fontSize: 12,
          }}
        >
          {profiles.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}{p.isDefault ? ' (defaut)' : ''}{p.id === currentId ? ' ✓' : ''}
            </option>
          ))}
        </select>
      )}
      <div style={{ fontSize: 10, color: '#444', marginTop: 6 }}>Local uniquement</div>
    </div>
  );
}
