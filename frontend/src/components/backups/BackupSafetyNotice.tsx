'use client';

export function BackupSafetyNotice() {
  return (
    <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm">
      <p className="mb-2 font-semibold text-emerald-300">Securite locale garantie</p>
      <ul className="space-y-1 text-xs text-slate-400">
        <li>100% local — aucun cloud, aucun upload</li>
        <li>.env jamais copie — marqueur de presence uniquement</li>
        <li>SHA256 obligatoire sur chaque fichier</li>
        <li>Confirmation requise avant suppression</li>
        <li>Restauration : commande PowerShell manuelle uniquement</li>
        <li>Aucun token, aucun secret dans les snapshots</li>
      </ul>
    </div>
  );
}
