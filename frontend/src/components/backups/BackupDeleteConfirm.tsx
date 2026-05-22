'use client';

import { useState } from 'react';

interface Props {
  snapshotId: string;
  open:       boolean;
  loading:    boolean;
  onClose:    () => void;
  onDelete:   (id: string, confirmation: string) => Promise<void>;
}

export function BackupDeleteConfirm({ snapshotId, open, loading, onClose, onDelete }: Props) {
  const [input, setInput] = useState('');

  if (!open) return null;

  const handleDelete = async () => {
    if (input !== 'SUPPRIMER') return;
    await onDelete(snapshotId, input);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-red-400/30 bg-[#0A2540] p-6 shadow-xl">
        <h2 className="mb-2 text-base font-bold text-red-300">Confirmer la suppression</h2>
        <p className="mb-1 text-xs text-slate-400">Snapshot : <code className="text-slate-200">{snapshotId}</code></p>
        <p className="mb-4 text-xs text-slate-500">
          Cette action est irreversible. Tapez <strong className="text-red-300">SUPPRIMER</strong> pour confirmer.
        </p>
        <input
          type="text" value={input} onChange={e => setInput(e.target.value)}
          placeholder="SUPPRIMER"
          className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline focus:outline-2 focus:outline-red-400"
        />
        <div className="flex gap-3">
          <button
            onClick={handleDelete} disabled={loading || input !== 'SUPPRIMER'}
            className="flex-1 rounded-lg bg-red-700 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40"
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 hover:bg-white/5"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
