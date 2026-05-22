'use client';

export function RestoreSafetyNotice() {
  return (
    <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-xs text-slate-400 space-y-1">
      <p className="font-semibold text-red-300 text-sm">Securite — lecture obligatoire</p>
      <p>La restauration ne peut pas etre effectuee automatiquement via le dashboard.</p>
      <p>Executez manuellement la commande PowerShell si vous decidez de continuer.</p>
      <p>Un backup pre-restauration sera cree automatiquement par le script.</p>
      <p>Aucun token, secret ou .env n&apos;est expose par cet assistant.</p>
    </div>
  );
}
