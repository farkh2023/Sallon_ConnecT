'use client';

import { useState } from 'react';

interface Props {
  open:     boolean;
  loading:  boolean;
  onClose:  () => void;
  onCreate: (type: 'quick' | 'full', exportZip: boolean) => Promise<void>;
}

export function BackupCreateModal({ open, loading, onClose, onCreate }: Props) {
  const [type, setType]         = useState<'quick' | 'full'>('quick');
  const [exportZip, setExportZip] = useState(false);

  if (!open) return null;

  const handleCreate = async () => {
    await onCreate(type, exportZip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0A2540] p-6 shadow-xl">
        <h2 className="mb-4 text-base font-bold text-slate-100">Creer une sauvegarde</h2>

        <div className="mb-4 space-y-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 p-3 hover:bg-white/5">
            <input
              type="radio" name="btype" value="quick" checked={type === 'quick'}
              onChange={() => setType('quick')} className="accent-sky-400"
            />
            <div>
              <div className="text-sm font-medium text-slate-200">Rapide (Quick)</div>
              <div className="text-xs text-slate-500">VERSION, package.json, data/, runtime/</div>
            </div>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 p-3 hover:bg-white/5">
            <input
              type="radio" name="btype" value="full" checked={type === 'full'}
              onChange={() => setType('full')} className="accent-violet-400"
            />
            <div>
              <div className="text-sm font-medium text-slate-200">Complet (Full)</div>
              <div className="text-xs text-slate-500">+ logs recents (200 lignes), scripts/*.ps1</div>
            </div>
          </label>
        </div>

        <label className="mb-4 flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox" checked={exportZip}
            onChange={e => setExportZip(e.target.checked)} className="accent-teal-400"
          />
          Exporter aussi en ZIP (necessite quelques secondes de plus)
        </label>

        <div className="flex gap-3">
          <button
            onClick={handleCreate} disabled={loading}
            className="flex-1 rounded-lg bg-sky-600 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? 'En cours...' : 'Creer'}
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
