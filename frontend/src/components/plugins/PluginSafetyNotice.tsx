export function PluginSafetyNotice() {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <p className="text-sm font-semibold text-amber-400">Plugins locaux uniquement</p>
      <ul className="mt-2 space-y-1 text-xs text-amber-300/80">
        <li>• Aucun plugin reseau ou cloud par defaut.</li>
        <li>• Aucune installation automatique depuis Internet.</li>
        <li>
          Chaque plugin doit etre place manuellement dans le dossier{' '}
          <code className="font-mono">plugins/</code> avec un fichier{' '}
          <code className="font-mono">plugin.json</code> valide.
        </li>
        <li>• Les erreurs de plugin n&apos;affectent pas le reste de l&apos;application.</li>
        <li>• Permissions limitees a la liste autorisee (read uniquement).</li>
      </ul>
    </div>
  );
}
