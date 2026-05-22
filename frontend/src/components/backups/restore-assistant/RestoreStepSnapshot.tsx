'use client';

import type { RestoreAssistantResponse } from '@/lib/types';
import { BackupStatusBadge } from '../BackupStatusBadge';

interface Props {
  assistant: RestoreAssistantResponse;
  onNext:    () => void;
}

export function RestoreStepSnapshot({ assistant, onNext }: Props) {
  const s       = assistant.snapshot;
  const blocked = assistant.status === 'blocked' && !s;

  if (!s) {
    return (
      <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
        Snapshot introuvable ou inaccessible. Restauration impossible.
      </div>
    );
  }

  const ts        = typeof s.timestamp === 'string' ? s.timestamp : null;
  const date      = ts ? new Date(ts).toLocaleString('fr-FR') : 'Date inconnue';
  const sizeKB    = typeof s.totalSizeKB === 'number' ? s.totalSizeKB : 0;
  const sizeLabel = sizeKB ? `${(sizeKB / 1024).toFixed(2)} MB` : 'Taille inconnue';
  const isValid   = !!s.valid;
  const idStr     = typeof s.id === 'string' ? s.id : String(s.id ?? '');
  const typeStr   = typeof s.type === 'string' ? s.type : 'unknown';
  const version   = typeof s.version === 'string' ? s.version : 'inconnue';
  const fileCount = typeof s.fileCount === 'number' ? s.fileCount : 0;
  const desc      = typeof s.description === 'string' ? s.description : '';

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.08] bg-[#0A2540] p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-sm text-slate-200">{idStr}</code>
          <BackupStatusBadge status={isValid ? 'valid' : 'corrupted'} />
          <BackupStatusBadge status={typeStr} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <span>Date : {date}</span>
          <span>Taille : {sizeLabel}</span>
          <span>Fichiers : {fileCount}</span>
          <span>Version : {version}</span>
        </div>
        {desc && (
          <p className="text-xs text-slate-500 italic">{desc}</p>
        )}
      </div>

      {!isValid && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-300">
          Ce snapshot est marque comme invalide. La restauration est bloquee.
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!isValid || blocked}
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-40"
      >
        Continuer vers la verification
      </button>
    </div>
  );
}
