import React from 'react';
import type { BackupManifest } from '../../lib/types';

interface Props {
  manifest: BackupManifest | null;
  onClose?: () => void;
}

export function BackupManifestView({ manifest, onClose }: Props) {
  if (!manifest) return null;

  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '12px 14px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>Manifest — {String(manifest.backupId || '').slice(0, 20)}</strong>
        {onClose && <button onClick={onClose} style={{ fontSize: 12, padding: '2px 8px', cursor: 'pointer' }}>Fermer</button>}
      </div>
      <div style={{ fontSize: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
        <span>Créé le&nbsp;: {manifest.createdAt ? new Date(manifest.createdAt).toLocaleString('fr-FR') : '—'}</span>
        <span>Phase&nbsp;: {manifest.phase}</span>
        <span>Mode&nbsp;: {manifest.mode}</span>
        <span>Profil&nbsp;: {manifest.profile}</span>
        <span>Fichiers&nbsp;: {manifest.summary?.fileCount ?? '—'}</span>
        <span>Taille&nbsp;: {manifest.summary?.totalSizeBucket ?? '—'}</span>
        <span>Runtime&nbsp;: {manifest.options?.includeRuntimeSafe ? 'oui' : 'non'}</span>
        <span>Audits&nbsp;: {manifest.options?.includeAudits ? 'oui' : 'non'}</span>
      </div>
      {manifest.security && (
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>
          Sécurité&nbsp;:
          {Object.entries(manifest.security).map(([k, v]) => (
            <span key={k} style={{ marginLeft: 6 }}>{k}={String(v)}</span>
          ))}
        </div>
      )}
      {Array.isArray(manifest.files) && manifest.files.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ fontSize: 12, cursor: 'pointer' }}>Fichiers ({manifest.files.length})</summary>
          <ul style={{ fontSize: 11, maxHeight: 120, overflowY: 'auto', margin: '4px 0 0 0', paddingLeft: 16 }}>
            {manifest.files.map((f, i) => (
              <li key={i}>{f.path} — {f.sizeBucket}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
