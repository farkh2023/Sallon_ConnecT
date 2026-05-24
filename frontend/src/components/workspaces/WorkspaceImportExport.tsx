'use client';

import { useState } from 'react';

interface WorkspaceImportExportProps {
  onImport: (payload: unknown) => Promise<boolean>;
}

export function WorkspaceImportExport({ onImport }: WorkspaceImportExportProps) {
  const [raw,     setRaw]     = useState('');
  const [status,  setStatus]  = useState<'idle' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setStatus('idle');
    setMessage('');
    let payload: unknown;
    try {
      payload = JSON.parse(raw.trim());
    } catch {
      setStatus('error');
      setMessage('JSON invalide.');
      return;
    }
    const ok = await onImport(payload);
    if (ok) {
      setStatus('ok');
      setMessage('Workspace importe avec succes.');
      setRaw('');
    } else {
      setStatus('error');
      setMessage('Erreur lors de l\'import.');
    }
  }

  return (
    <div style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: 8, padding: 14 }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: '#e0e0e0', marginBottom: 10 }}>Importer un workspace</div>
      <form onSubmit={handleImport}>
        <textarea
          value={raw}
          onChange={e => setRaw(e.target.value)}
          placeholder={"Coller le JSON d'export ici..."}
          rows={5}
          style={{
            width: '100%', padding: '6px 8px', borderRadius: 4,
            border: '1px solid #333', background: '#1a1a2e', color: '#e0e0e0',
            fontSize: 11, fontFamily: 'monospace', resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          {status !== 'idle' && (
            <span style={{ fontSize: 11, color: status === 'ok' ? '#4ade80' : '#f87171' }}>{message}</span>
          )}
          <button
            type="submit"
            disabled={!raw.trim()}
            style={{ marginLeft: 'auto', padding: '5px 12px', fontSize: 12, borderRadius: 4, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}
          >
            Importer
          </button>
        </div>
      </form>
      <div style={{ fontSize: 10, color: '#444', marginTop: 8 }}>
        L&#39;export est produit depuis la page workspace. Local uniquement.
      </div>
    </div>
  );
}
