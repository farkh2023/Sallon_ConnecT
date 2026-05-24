'use client';

import { useState } from 'react';

interface MemoryImportExportProps {
  loading:   boolean;
  onExport:  () => Promise<string | null>;
  onImport:  (raw: string) => Promise<boolean>;
  onClear:   () => Promise<boolean>;
}

export function MemoryImportExport({ loading, onExport, onImport, onClear }: MemoryImportExportProps) {
  const [raw,         setRaw]         = useState('');
  const [parseErr,    setParseErr]    = useState<string | null>(null);
  const [exported,    setExported]    = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  async function handleExport() {
    const filename = await onExport();
    if (filename) setExported(filename);
  }

  async function handleImport() {
    try {
      JSON.parse(raw);
    } catch {
      setParseErr('JSON invalide — verifiez la syntaxe avant d\'importer.');
      return;
    }
    setParseErr(null);
    const ok = await onImport(raw);
    if (ok) setRaw('');
  }

  async function handleClear() {
    if (!confirmClear) { setConfirmClear(true); return; }
    await onClear();
    setConfirmClear(false);
  }

  return (
    <div className="space-y-6">
      {/* Export */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400">Exporter la memoire</p>
        <p className="text-[11px] text-slate-500">
          Les items sont exporetes sans secrets — chemins et tokens masques.
        </p>
        {exported && (
          <div className="rounded bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-400">
            Exporte dans <span className="font-mono">{exported}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={loading}
          className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs text-sky-400 hover:bg-sky-500/20 disabled:opacity-40"
        >
          Exporter (JSON local)
        </button>
      </div>

      {/* Import */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400">Importer des items</p>
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-300">
          Les items seront valides et localOnly force avant import.
        </div>
        <textarea
          value={raw}
          onChange={e => { setRaw(e.target.value); setParseErr(null); }}
          placeholder='{ "items": [{"type":"note","scope":"user","content":"...","source":"manual",...}] }'
          rows={5}
          disabled={loading}
          aria-label="JSON a importer"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          spellCheck={false}
        />
        {parseErr && <p className="text-xs text-red-400" role="alert">{parseErr}</p>}
        <button
          type="button"
          onClick={() => void handleImport()}
          disabled={!raw.trim() || loading}
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-40"
        >
          Importer
        </button>
      </div>

      {/* Clear */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400">Effacer toute la memoire</p>
        <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-[11px] text-red-300">
          Cette action supprime definitivement tous les items de memoire locale.
        </div>
        {confirmClear ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400">{"Confirmer l'effacement complet ?"}</span>
            <button
              type="button"
              onClick={() => void handleClear()}
              disabled={loading}
              className="rounded bg-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/30"
            >
              Oui, effacer
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="rounded bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void handleClear()}
            disabled={loading}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-400 hover:bg-red-500/20 disabled:opacity-40"
          >
            Effacer toute la memoire
          </button>
        )}
      </div>
    </div>
  );
}
