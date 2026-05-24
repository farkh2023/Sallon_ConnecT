'use client';

import type { WorkspaceProfile } from '@/lib/types';

interface WorkspaceCardProps {
  profile:    WorkspaceProfile;
  isCurrent:  boolean;
  onSwitch:   (id: string) => void;
  onEdit:     (profile: WorkspaceProfile) => void;
  onExport:   (id: string) => void;
  onDelete:   (id: string) => void;
}

export function WorkspaceCard({ profile, isCurrent, onSwitch, onEdit, onExport, onDelete }: WorkspaceCardProps) {
  const border = isCurrent ? '1px solid #4f46e5' : '1px solid #1e1e3a';

  return (
    <div style={{
      background: '#0f0f1a', border, borderRadius: 8,
      padding: '12px 14px', marginBottom: 8, position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#e0e0e0' }}>
            {profile.name}
            {isCurrent && (
              <span style={{ marginLeft: 8, fontSize: 10, color: '#4f46e5', background: '#1a1a3e', padding: '1px 6px', borderRadius: 4 }}>
                Actif
              </span>
            )}
            {profile.isDefault && (
              <span style={{ marginLeft: 6, fontSize: 10, color: '#888', background: '#1a1a2e', padding: '1px 6px', borderRadius: 4 }}>
                Par defaut
              </span>
            )}
          </div>
          {profile.description && (
            <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{profile.description}</div>
          )}
          <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
            Theme: {profile.settings?.theme ?? 'dark'} &middot; Langue: {profile.settings?.language ?? 'fr'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {!isCurrent && (
            <button
              onClick={() => onSwitch(profile.id)}
              style={{ padding: '3px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #4f46e5', background: 'transparent', color: '#4f46e5', cursor: 'pointer' }}
            >
              Activer
            </button>
          )}
          <button
            onClick={() => onEdit(profile)}
            style={{ padding: '3px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #444', background: 'transparent', color: '#aaa', cursor: 'pointer' }}
          >
            Editer
          </button>
          <button
            onClick={() => onExport(profile.id)}
            style={{ padding: '3px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #444', background: 'transparent', color: '#aaa', cursor: 'pointer' }}
          >
            Exporter
          </button>
          {!isCurrent && (
            <button
              onClick={() => onDelete(profile.id)}
              style={{ padding: '3px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #5c1a1a', background: 'transparent', color: '#c77', cursor: 'pointer' }}
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
