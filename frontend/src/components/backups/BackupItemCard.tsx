'use client';

import type { BackupDashboardItem } from '@/lib/types';
import { BackupStatusBadge } from './BackupStatusBadge';

interface Props {
  item:           BackupDashboardItem;
  loading:        boolean;
  onVerify:       (id: string) => void;
  onExport:       (id: string) => void;
  onRestore:      (id: string) => void;
  onDelete:       (id: string) => void;
}

export function BackupItemCard({ item, loading, onVerify, onExport, onRestore, onDelete }: Props) {
  const date = item.timestamp ? new Date(item.timestamp).toLocaleString('fr-FR') : 'Date inconnue';

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0A2540] p-4">
      <div className="mb-2 flex flex-wrap items-start gap-2">
        <code className="text-xs text-slate-300">{item.id}</code>
        <div className="ml-auto flex flex-wrap gap-1">
          <BackupStatusBadge status={item.valid ? 'valid' : 'corrupted'} />
          <BackupStatusBadge status={item.type} />
          {item.hasChecksum && <BackupStatusBadge status="verified" />}
        </div>
      </div>

      <p className="mb-1 text-xs text-slate-500">{date}</p>
      {item.description && (
        <p className="mb-2 text-xs text-slate-400 italic">{item.description}</p>
      )}

      <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span>{item.fileCount} fichiers</span>
        <span>{(item.totalSizeKB / 1024).toFixed(2)} MB</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onVerify(item.id)} disabled={loading}
          className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-40"
        >
          Verifier
        </button>
        <button
          onClick={() => onExport(item.id)} disabled={loading}
          className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-40"
        >
          Exporter ZIP
        </button>
        <button
          onClick={() => onRestore(item.id)} disabled={loading}
          className="rounded-md border border-amber-400/30 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-400/10 disabled:opacity-40"
        >
          Preparer restauration
        </button>
        <button
          onClick={() => onDelete(item.id)} disabled={loading}
          className="ml-auto rounded-md border border-red-400/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 disabled:opacity-40"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
