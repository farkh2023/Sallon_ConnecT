import React, { useState } from 'react';
import type { BackupDryRunResult } from '../../lib/types';

interface Props {
  backupId: string;
  dryRunResult: BackupDryRunResult | null;
  loading?: boolean;
  onDryRun: (backupId: string) => Promise<void>;
  onRestore: (backupId: string, opts: { confirmationCode: string; reason: string }) => Promise<void>;
}

export function BackupRestoreDryRun({ backupId, dryRunResult, loading, onDryRun, onRestore }: Props) {
  const [confirmCode, setConfirmCode] = useState('');
  const [reason, setReason] = useState('Restauration contrôlée');
  const [restoring, setRestoring] = useState(false);

  async function handleRestore() {
    if (!confirmCode) return;
    setRestoring(true);
    try {
      await onRestore(backupId, { confirmationCode: confirmCode, reason });
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div style={{ fontSize: 13 }}>
      <button
        onClick={() => onDryRun(backupId)}
        disabled={loading}
        style={{ padding: '4px 12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 8 }}
      >
        {loading ? 'Analyse…' : 'Lancer dry-run restauration'}
      </button>

      {dryRunResult && !dryRunResult.error && (
        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 4, padding: '8px 10px', marginBottom: 8 }}>
          <div><strong>Dry-run terminé</strong></div>
          <div>Fichiers à restaurer&nbsp;: {dryRunResult.willRestore.length}</div>
          <div>Conflits&nbsp;: {dryRunResult.conflicts.length}</div>
          <div>Nouveaux fichiers&nbsp;: {dryRunResult.newFiles.length}</div>
          {dryRunResult.risks.map((r, i) => (
            <div key={i} style={{ color: '#92400e', fontSize: 12 }}>⚠ {r}</div>
          ))}

          <div style={{ marginTop: 8, borderTop: '1px solid #fde68a', paddingTop: 8 }}>
            <div style={{ marginBottom: 4 }}>
              <label>Code de confirmation</label>
              <input
                type="text"
                value={confirmCode}
                onChange={e => setConfirmCode(e.target.value)}
                placeholder="CONFIRMER_BACKUP"
                style={{ marginLeft: 8, fontSize: 12, padding: '2px 6px', border: '1px solid #d1d5db', borderRadius: 4 }}
              />
            </div>
            <div style={{ marginBottom: 6 }}>
              <label>Raison</label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                maxLength={100}
                style={{ marginLeft: 8, fontSize: 12, padding: '2px 6px', border: '1px solid #d1d5db', borderRadius: 4 }}
              />
            </div>
            <button
              onClick={handleRestore}
              disabled={!confirmCode || restoring}
              style={{ padding: '4px 12px', background: confirmCode ? '#dc2626' : '#9ca3af', color: '#fff', border: 'none', borderRadius: 4, cursor: confirmCode && !restoring ? 'pointer' : 'not-allowed' }}
            >
              {restoring ? 'Restauration…' : 'Restaurer (définitif)'}
            </button>
            {!confirmCode && <span style={{ color: '#ef4444', marginLeft: 8, fontSize: 11 }}>Code de confirmation requis</span>}
          </div>
        </div>
      )}

      {dryRunResult?.error && (
        <div style={{ color: '#ef4444', fontSize: 12 }}>{dryRunResult.error}</div>
      )}
    </div>
  );
}
