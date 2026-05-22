'use client';

export function BackupLimitations() {
  return (
    <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
      <p className="mb-2 text-sm font-semibold text-amber-300">Limitations connues</p>
      <ul className="space-y-1 text-xs text-slate-400">
        <li>Chiffrement ZIP : necessite 7-Zip installe (non obligatoire)</li>
        <li>Logs dans backup &ldquo;full&rdquo; : tronques a 200 lignes par fichier</li>
        <li>node_modules/, .next/, cache/ exclus des snapshots</li>
        <li>Restauration impossible via l&apos;interface — commande PowerShell requise</li>
        <li>Scripts PowerShell requis (Windows uniquement)</li>
        <li>Snapshots exclus du ZIP portable de distribution</li>
      </ul>
    </div>
  );
}
