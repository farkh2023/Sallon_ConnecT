'use client';

import { useState } from 'react';
import type { WorkflowDefinition } from '@/lib/types';

interface WorkflowImportExportProps {
  loading:   boolean;
  onImport:  (wf: WorkflowDefinition) => void;
  exported:  WorkflowDefinition | null;
  onClear:   () => void;
}

export function WorkflowImportExport({ loading, onImport, exported, onClear }: WorkflowImportExportProps) {
  const [raw,      setRaw]      = useState('');
  const [parseErr, setParseErr] = useState<string | null>(null);

  function handleImport() {
    try {
      const wf = JSON.parse(raw) as WorkflowDefinition;
      onImport(wf);
      setRaw('');
    } catch {
      setParseErr('JSON invalide — impossible d\'importer.');
    }
  }

  function downloadExport() {
    if (!exported) return;
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${exported.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Import */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400">Importer un workflow</p>
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-300">
          Le workflow sera valide et forcer en mode local-only et dry-run avant import.
        </div>
        <textarea
          value={raw}
          onChange={e => { setRaw(e.target.value); setParseErr(null); }}
          aria-label="JSON du workflow a importer"
          placeholder='{"id":"mon-workflow","name":"...","localOnly":true,"dryRun":true,"nodes":[],...}'
          rows={5}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          disabled={loading}
          spellCheck={false}
        />
        {parseErr && <p className="text-xs text-red-400" role="alert">{parseErr}</p>}
        <button
          type="button"
          onClick={handleImport}
          disabled={!raw.trim() || loading}
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-40"
        >
          Importer
        </button>
      </div>

      {/* Export */}
      {exported && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400">Workflow exporte</p>
          <pre className="max-h-40 overflow-auto rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[10px] text-slate-400">
            {JSON.stringify(exported, null, 2).slice(0, 2000)}
          </pre>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={downloadExport}
              className="rounded border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-400 hover:bg-sky-500/20"
            >
              Telecharger JSON
            </button>
            <button
              type="button"
              onClick={onClear}
              aria-label="Effacer l'export"
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Effacer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
