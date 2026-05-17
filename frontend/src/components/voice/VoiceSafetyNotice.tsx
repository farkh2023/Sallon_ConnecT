export function VoiceSafetyNotice() {
  return (
    <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-100">
      <div className="mb-2 flex flex-wrap gap-2">
        <span className="rounded-full border border-emerald-300/30 px-2 py-0.5">local</span>
        <span className="rounded-full border border-emerald-300/30 px-2 py-0.5">aucun cloud</span>
        <span className="rounded-full border border-emerald-300/30 px-2 py-0.5">audio non stocke</span>
      </div>
      Les commandes vocales ne lancent aucune action sensible. Les transcriptions affichees sont masquees et restent en memoire locale.
    </div>
  );
}
