import React from 'react';
import type { BackupStatus } from '../../lib/types';

interface Props {
  status: BackupStatus | null;
  loading?: boolean;
}

export function BackupStatusCard({ status, loading }: Props) {
  if (loading) return <div style={{ color: '#6b7280', fontSize: 13 }}>Chargement statut…</div>;
  if (!status) return <div style={{ color: '#ef4444', fontSize: 13 }}>Statut indisponible</div>;

  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 14px', marginBottom: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        Sauvegarde&nbsp;
        <span style={{ color: status.enabled ? '#16a34a' : '#ef4444' }}>
          {status.enabled ? '● active' : '● désactivée'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 13 }}>
        <span>Dossier&nbsp;: <code>{status.backupDirMasked}</code></span>
        <span>Max&nbsp;: {status.maxItems} sauvegardes</span>
        <span>Existantes&nbsp;: {status.count}</span>
        <span>Rollback&nbsp;: {status.rollbackEnabled ? 'activé' : 'désactivé'}</span>
        <span>Dry-run requis&nbsp;: {status.dryRunRequired ? 'oui' : 'non'}</span>
        <span>Confirmation requise&nbsp;: {status.confirmationRequired ? 'oui' : 'non'}</span>
        {status.latest && (
          <span style={{ gridColumn: '1/-1' }}>
            Dernière&nbsp;: {status.latest.backupId.slice(0, 20)} — {new Date(status.latest.createdAt).toLocaleString('fr-FR')}
          </span>
        )}
      </div>
    </div>
  );
}
