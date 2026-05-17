import React, { useState } from 'react';
import type { BackupItem, BackupManifest, BackupDryRunResult } from '../../lib/types';
import { BackupManifestView } from './BackupManifestView';
import { BackupRestoreDryRun } from './BackupRestoreDryRun';

interface Props {
  backups: BackupItem[];
  loading?: boolean;
  onVerify: (backupId: string) => Promise<unknown>;
  onDelete: (backupId: string) => Promise<void>;
  onLoadManifest: (backupId: string) => Promise<BackupManifest | null>;
  onDryRun: (backupId: string) => Promise<BackupDryRunResult | null>;
  onRestore: (backupId: string, opts: { confirmationCode: string; reason: string }) => Promise<void>;
}

export function BackupList({ backups, loading, onVerify, onDelete, onLoadManifest, onDryRun, onRestore }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [manifests, setManifests] = useState<Record<string, BackupManifest>>({});
  const [dryRunResults, setDryRunResults] = useState<Record<string, BackupDryRunResult>>({});
  const [verifyResults, setVerifyResults] = useState<Record<string, { valid: boolean; issues: string[] }>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (loading) return <div style={{ color: '#6b7280', fontSize: 13 }}>Chargement sauvegardes…</div>;
  if (backups.length === 0) return <p style={{ fontSize: 13, color: '#6b7280' }}>Aucune sauvegarde disponible.</p>;

  async function handleLoadManifest(id: string) {
    if (manifests[id]) {
      setExpandedId(expandedId === id ? null : id);
      return;
    }
    const m = await onLoadManifest(id);
    if (m) setManifests(prev => ({ ...prev, [id]: m }));
    setExpandedId(id);
  }

  async function handleVerify(id: string) {
    setActionLoading(id + '_verify');
    const result = await onVerify(id) as { valid: boolean; issues: string[] };
    if (result) setVerifyResults(prev => ({ ...prev, [id]: result }));
    setActionLoading(null);
  }

  async function handleDryRun(id: string) {
    setActionLoading(id + '_dryrun');
    const result = await onDryRun(id);
    if (result) setDryRunResults(prev => ({ ...prev, [id]: result }));
    setActionLoading(null);
  }

  async function handleRestore(id: string, opts: { confirmationCode: string; reason: string }) {
    await onRestore(id, opts);
  }

  return (
    <div>
      {backups.map(b => (
        <div key={b.backupId} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 14px', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 13 }}>
              <div><strong>{b.backupId.slice(0, 24)}</strong></div>
              <div style={{ color: '#6b7280', fontSize: 11 }}>
                {new Date(b.createdAt).toLocaleString('fr-FR')} — {b.summary ? `${b.summary.fileCount} fichiers, ${b.summary.totalSizeBucket}` : '—'}
                {b.checksumPresent && <span style={{ color: '#16a34a', marginLeft: 6 }}>✓ checksum</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <button onClick={() => handleLoadManifest(b.backupId)} style={{ fontSize: 11, padding: '2px 7px', cursor: 'pointer' }}>Manifest</button>
              <button onClick={() => handleVerify(b.backupId)} disabled={actionLoading === b.backupId + '_verify'} style={{ fontSize: 11, padding: '2px 7px', cursor: 'pointer' }}>Vérifier</button>
              <button onClick={() => onDelete(b.backupId)} style={{ fontSize: 11, padding: '2px 7px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer' }}>Supprimer</button>
            </div>
          </div>

          {verifyResults[b.backupId] && (
            <div style={{ fontSize: 12, marginTop: 4, color: verifyResults[b.backupId].valid ? '#16a34a' : '#ef4444' }}>
              {verifyResults[b.backupId].valid ? '✓ Intégrité vérifiée' : `✗ Problèmes: ${verifyResults[b.backupId].issues.join(', ')}`}
            </div>
          )}

          {expandedId === b.backupId && manifests[b.backupId] && (
            <BackupManifestView manifest={manifests[b.backupId]} onClose={() => setExpandedId(null)} />
          )}

          <BackupRestoreDryRun
            backupId={b.backupId}
            dryRunResult={dryRunResults[b.backupId] || null}
            loading={actionLoading === b.backupId + '_dryrun'}
            onDryRun={handleDryRun}
            onRestore={handleRestore}
          />
        </div>
      ))}
    </div>
  );
}
