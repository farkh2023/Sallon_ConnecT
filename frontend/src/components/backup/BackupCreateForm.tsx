import React, { useState } from 'react';

interface Props {
  onCreate: (opts: { includeRuntimeSafe: boolean; includeAudits: boolean; includeLogs: boolean; reason: string }) => Promise<void>;
  loading?: boolean;
}

export function BackupCreateForm({ onCreate, loading }: Props) {
  const [includeRuntimeSafe, setIncludeRuntimeSafe] = useState(true);
  const [includeAudits, setIncludeAudits] = useState(false);
  const [includeLogs, setIncludeLogs] = useState(false);
  const [reason, setReason] = useState('Sauvegarde manuelle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onCreate({ includeRuntimeSafe, includeAudits, includeLogs, reason });
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '12px 14px', marginBottom: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Créer une sauvegarde</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        <label style={{ fontSize: 13 }}>
          <input type="checkbox" checked={includeRuntimeSafe} onChange={e => setIncludeRuntimeSafe(e.target.checked)} style={{ marginRight: 6 }} />
          Inclure runtime sûr (profils, schedules, snapshots)
        </label>
        <label style={{ fontSize: 13 }}>
          <input type="checkbox" checked={includeAudits} onChange={e => setIncludeAudits(e.target.checked)} style={{ marginRight: 6 }} />
          Inclure audits
        </label>
        <label style={{ fontSize: 13 }}>
          <input type="checkbox" checked={includeLogs} onChange={e => setIncludeLogs(e.target.checked)} style={{ marginRight: 6 }} />
          Inclure logs
        </label>
        <div>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 2 }}>Raison</label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            maxLength={100}
            style={{ fontSize: 13, padding: '3px 6px', border: '1px solid #d1d5db', borderRadius: 4, width: '100%' }}
          />
        </div>
      </div>
      <button type="submit" disabled={loading} style={{ fontSize: 13, padding: '5px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Sauvegarde en cours…' : 'Créer sauvegarde sûre'}
      </button>
    </form>
  );
}
