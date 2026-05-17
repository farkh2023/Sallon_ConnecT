import React from 'react';

export function BackupSafetyNotice() {
  return (
    <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '10px 14px', marginBottom: 12 }}>
      <strong>Sécurité sauvegarde</strong>
      <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: 13 }}>
        <li>100&nbsp;% local — aucune donnée envoyée vers le cloud</li>
        <li>Fichiers sensibles exclus&nbsp;: .env, dépendances, .git, clés, logs bruts</li>
        <li>Chemins absolus masqués dans tous les manifests</li>
        <li>Restauration impossible sans dry-run préalable et code de confirmation</li>
        <li>Un rollback est créé automatiquement avant toute restauration</li>
      </ul>
    </div>
  );
}
