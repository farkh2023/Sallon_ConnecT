'use client';

import type { WorkspaceProfile } from '@/lib/types';

interface WorkspaceSwitcherProps {
  profiles:   WorkspaceProfile[];
  currentId:  string | null;
  onSwitch:   (id: string) => void;
  disabled?:  boolean;
}

export function WorkspaceSwitcher({ profiles, currentId, onSwitch, disabled }: WorkspaceSwitcherProps) {
  if (!profiles.length) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <label htmlFor="workspace-switcher" style={{ fontSize: 11, color: '#888' }}>Workspace :</label>
      <select
        id="workspace-switcher"
        value={currentId ?? ''}
        onChange={e => { if (e.target.value && e.target.value !== currentId) onSwitch(e.target.value); }}
        disabled={disabled}
        style={{
          padding: '4px 8px', borderRadius: 4, border: '1px solid #333',
          background: '#1a1a2e', color: '#e0e0e0', fontSize: 12, cursor: 'pointer',
        }}
      >
        {profiles.map(p => (
          <option key={p.id} value={p.id}>{p.name}{p.isDefault ? ' (defaut)' : ''}</option>
        ))}
      </select>
    </div>
  );
}
