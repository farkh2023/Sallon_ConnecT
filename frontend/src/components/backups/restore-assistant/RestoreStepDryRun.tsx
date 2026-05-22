'use client';

import type { RestoreDryRunResult } from '@/lib/types';

interface Props {
  dryRun:   RestoreDryRunResult | null;
  loading:  boolean;
  onLoad:   () => void;
  onNext:   () => void;
  onBack:   () => void;
}

function FileList({ label, files, color }: { label: string; files: string[]; color: string }) {
  if (!files.length) return null;
  return (
    <div>
      <p className={`mb-1 text-xs font-semibold ${color}`}>{label}</p>
      <ul className="max-h-24 overflow-y-auto space-y-0.5">
        {files.map((f, i) => <li key={i} className="text-xs text-slate-400"><code>{f}</code></li>)}
      </ul>
    </div>
  );
}

export function RestoreStepDryRun({ dryRun, loading, onLoad, onNext, onBack }: Props) {
  if (!dryRun) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Le dry-run simule la restauration sans rien modifier.</p>
        <button
          onClick={onLoad} disabled={loading}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-40"
        >
          {loading ? 'Simulation...' : 'Lancer le dry-run'}
        </button>
        <button onClick={onBack} className="ml-2 rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:bg-white/5">Retour</button>
      </div>
    );
  }

  const blocked = dryRun.status === 'blocked';

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border p-4 space-y-3 ${blocked ? 'border-red-400/20 bg-red-400/5' : 'border-white/[0.08] bg-[#0A2540]'}`}>
        <p className={`text-sm font-semibold ${blocked ? 'text-red-300' : 'text-slate-100'}`}>
          {blocked ? 'Dry-run bloque' : 'Dry-run — simulation OK'}
        </p>

        {dryRun.blockedReasons.length > 0 && (
          <ul className="space-y-1 text-xs text-red-300">
            {dryRun.blockedReasons.map((r, i) => <li key={i}>! {r}</li>)}
          </ul>
        )}

        <FileList label="Serait restaure"  files={dryRun.wouldRestore} color="text-sky-300" />
        <FileList label="Serait remplace"  files={dryRun.wouldReplace} color="text-amber-300" />
        <FileList label="Serait conserve"  files={dryRun.wouldKeep}    color="text-emerald-300" />
        <FileList label="Exclus (jamais modifies)" files={dryRun.excluded} color="text-slate-400" />

        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-2 text-xs text-emerald-300">
          Un backup pre-restauration ({dryRun.preRestoreBackup.type}) sera cree automatiquement par le script.
        </div>

        {dryRun.warnings.map((w, i) => (
          <p key={i} className="text-xs text-amber-300">! {w}</p>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:bg-white/5">Retour</button>
        <button
          onClick={onNext} disabled={blocked}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-40"
        >
          Continuer vers le score de risque
        </button>
      </div>
    </div>
  );
}
