'use client';

import { useState } from 'react';
import type { WorkflowDefinition } from '@/lib/types';
import { WorkflowCanvas } from './WorkflowCanvas';

interface WorkflowEditorProps {
  initial?: Partial<WorkflowDefinition>;
  loading:  boolean;
  onSave:   (wf: WorkflowDefinition) => void;
  onCancel: () => void;
}

function makeEmpty(): WorkflowDefinition {
  return {
    id: `wf-${Date.now().toString(36)}`,
    name: 'Nouveau workflow',
    description: '',
    version: '1.0.0',
    enabled: true,
    localOnly: true,
    dryRun: true,
    nodes: [],
    edges: [],
    triggers: [{ type: 'manual' }],
  };
}

export function WorkflowEditor({ initial, loading, onSave, onCancel }: WorkflowEditorProps) {
  const [raw,     setRaw]     = useState(JSON.stringify(initial || makeEmpty(), null, 2));
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  function parsed(): WorkflowDefinition | null {
    try {
      return JSON.parse(raw);
    } catch { return null; }
  }

  function handleChange(val: string) {
    setRaw(val);
    setParseErr(null);
    try { JSON.parse(val); } catch { setParseErr('JSON invalide'); }
  }

  function handleSave() {
    const wf = parsed();
    if (!wf) { setParseErr('JSON invalide'); return; }
    // Forcer securite
    wf.localOnly = true;
    wf.dryRun    = true;
    onSave(wf);
  }

  const wf = parsed();

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-300">
        Editeur JSON securise — localOnly et dryRun sont forces a true.
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPreview(false)}
          aria-pressed={!preview}
          className={`rounded px-2.5 py-1 text-xs ${!preview ? 'bg-sky-500/20 text-sky-300' : 'text-slate-500 hover:text-slate-300'}`}
        >
          JSON
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          aria-pressed={preview}
          className={`rounded px-2.5 py-1 text-xs ${preview ? 'bg-sky-500/20 text-sky-300' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Apercu
        </button>
      </div>

      {!preview && (
        <div className="space-y-1">
          <textarea
            value={raw}
            onChange={e => handleChange(e.target.value)}
            aria-label="Definition JSON du workflow"
            rows={12}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
            disabled={loading}
            spellCheck={false}
          />
          {parseErr && <p className="text-xs text-red-400" role="alert">{parseErr}</p>}
        </div>
      )}

      {preview && wf && (
        <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 space-y-2">
          <p className="text-sm font-semibold text-slate-200">{wf.name}</p>
          <p className="text-xs text-slate-500">{wf.description}</p>
          <WorkflowCanvas nodes={wf.nodes || []} edges={wf.edges || []} />
        </div>
      )}

      {preview && !wf && (
        <p className="text-xs text-red-400">JSON invalide — corriger avant d&apos;afficher l&apos;apercu.</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!!parseErr || loading}
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-40"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
