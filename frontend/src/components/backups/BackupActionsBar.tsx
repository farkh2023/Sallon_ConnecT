'use client';

interface Props {
  loading:         boolean;
  onQuickBackup:   () => void;
  onFullBackup:    () => void;
  onRefresh:       () => void;
  onOpenCreate:    () => void;
}

export function BackupActionsBar({ loading, onQuickBackup, onFullBackup, onRefresh, onOpenCreate }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onQuickBackup} disabled={loading}
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
      >
        Backup rapide
      </button>
      <button
        onClick={onFullBackup} disabled={loading}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
      >
        Backup complet
      </button>
      <button
        onClick={onOpenCreate} disabled={loading}
        className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
      >
        Options...
      </button>
      <button
        onClick={onRefresh} disabled={loading}
        className="ml-auto rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400 hover:bg-white/5 disabled:opacity-40"
        title="Actualiser"
      >
        {loading ? '...' : '↻'}
      </button>
    </div>
  );
}
