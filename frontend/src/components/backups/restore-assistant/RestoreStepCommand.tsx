'use client';

import type { RestoreManualCommand } from '@/lib/types';
import { RestoreManualCommandBox } from './RestoreManualCommandBox';
import { RestoreSafetyNotice }    from './RestoreSafetyNotice';

interface Props {
  command:  RestoreManualCommand | null;
  loading:  boolean;
  onLoad:   () => void;
  onBack:   () => void;
  onReset:  () => void;
}

export function RestoreStepCommand({ command, loading, onLoad, onBack, onReset }: Props) {
  return (
    <div className="space-y-4">
      <RestoreSafetyNotice />

      {!command ? (
        <button
          onClick={onLoad} disabled={loading}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-40"
        >
          {loading ? 'Chargement...' : 'Obtenir la commande'}
        </button>
      ) : (
        <RestoreManualCommandBox command={command.command} />
      )}

      {command && (
        <p className="text-xs text-slate-500">{command.note}</p>
      )}

      <div className="flex gap-2">
        <button onClick={onBack} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:bg-white/5">Retour</button>
        <button onClick={onReset} className="rounded-lg border border-slate-600 px-4 py-2 text-xs text-slate-400 hover:bg-white/5">
          Recommencer
        </button>
      </div>
    </div>
  );
}
