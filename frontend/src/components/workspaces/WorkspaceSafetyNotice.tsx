'use client';

export function WorkspaceSafetyNotice() {
  return (
    <div style={{
      background: '#0d1117', border: '1px solid #1e3a5f',
      borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#7aa8d0',
      marginBottom: 12,
    }}>
      <span style={{ fontWeight: 600, color: '#4f9cf9' }}>Local uniquement.</span>
      {' '}Aucun profil ou donnee de workspace ne quitte votre machine.
      Les secrets sont masques. La suppression du workspace courant est bloquee.
    </div>
  );
}
