import React from 'react';
import type { BackupAuditEntry } from '../../lib/types';

interface Props {
  audit: BackupAuditEntry[];
  onClear: () => void;
}

export function BackupAudit({ audit, onClear }: Props) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <strong style={{ fontSize: 14 }}>Audit backup ({audit.length})</strong>
        <button onClick={onClear} style={{ fontSize: 12, padding: '2px 8px', cursor: 'pointer' }}>
          Effacer l&apos;audit
        </button>
      </div>
      {audit.length === 0 ? (
        <p style={{ fontSize: 13, color: '#6b7280' }}>Aucune entrée d&apos;audit.</p>
      ) : (
        <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 4 }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>Événement</th>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((entry, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '3px 8px' }}>{new Date(entry.at).toLocaleString('fr-FR')}</td>
                  <td style={{ padding: '3px 8px' }}>{entry.event}</td>
                  <td style={{ padding: '3px 8px' }}>{entry.backupId ? entry.backupId.slice(0, 16) + '…' : '—'}</td>
                  <td style={{ padding: '3px 8px', color: entry.status === 'success' ? '#16a34a' : entry.status === 'refused' ? '#ef4444' : undefined }}>
                    {entry.status || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
